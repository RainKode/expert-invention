'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawRow {
  name: string;
  email: string;
  role: string;
  team_name: string;
  timezone: string;
  manager_email?: string;
  work_week?: string;
  available_hours?: string;
  billable_permission?: string;
}

interface RowError {
  row: number;
  email: string;
  errors: string[];
}

type RowStatus = 'valid' | 'error';

// Separate from RawRow to avoid index-signature conflicts
interface ParsedRow {
  name: string;
  email: string;
  role: string;
  team_name: string;
  timezone: string;
  manager_email?: string;
  work_week?: string;
  available_hours?: string;
  billable_permission?: string;
  _row: number;
  _status: RowStatus;
  _errors: string[];
}

type Step = 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// CSV template
// ---------------------------------------------------------------------------

const TEMPLATE_HEADERS = [
  'name',
  'email',
  'role',
  'team_name',
  'timezone',
  'manager_email',
  'work_week',
  'available_hours',
  'billable_permission',
];

const SAMPLE_ROW = [
  'Jane Smith',
  'jane@company.com',
  'employee',
  'Engineering',
  'Europe/London',
  'manager@company.com',
  'Mon,Tue,Wed,Thu,Fri',
  '8',
  'full',
];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(','), SAMPLE_ROW.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sunday_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Client-side row validation (mirrors API but faster feedback)
// ---------------------------------------------------------------------------

const VALID_ROLES = ['admin', 'planner', 'senior_manager', 'manager', 'team_leader', 'employee'];
const VALID_BILLABLE = ['full', 'partial', 'none'];
const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function validateRow(row: RawRow, index: number, seenEmails: Set<string>): string[] {
  const errors: string[] = [];

  if (!row.name?.trim()) errors.push('Name is required');
  if (!row.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
    errors.push('Invalid email address');
  } else if (seenEmails.has(row.email.trim().toLowerCase())) {
    errors.push('Duplicate email in file');
  }

  if (!row.role?.trim()) {
    errors.push('Role is required');
  } else if (!VALID_ROLES.includes(row.role.trim().toLowerCase())) {
    errors.push(`Role must be one of: ${VALID_ROLES.join(', ')}`);
  }

  if (!row.team_name?.trim()) errors.push('Team name is required');
  if (!row.timezone?.trim()) errors.push('Timezone is required');

  if (row.manager_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.manager_email.trim())) {
    errors.push('Invalid manager email');
  }

  if (row.work_week?.trim()) {
    const days = row.work_week.split(',').map((d) => d.trim());
    const invalid = days.filter((d) => !VALID_DAYS.includes(d));
    if (invalid.length > 0) errors.push(`Invalid days: ${invalid.join(', ')}`);
  }

  if (row.available_hours?.trim()) {
    const h = Number(row.available_hours);
    if (isNaN(h) || h < 1 || h > 60) errors.push('Available hours must be 1–60');
  }

  if (row.billable_permission?.trim() && !VALID_BILLABLE.includes(row.billable_permission.trim().toLowerCase())) {
    errors.push(`Billable permission must be: ${VALID_BILLABLE.join(', ')}`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ['Instructions', 'Upload', 'Preview', 'Done'];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="mb-16 relative flex justify-between max-w-3xl">
      {/* connector line */}
      <div className="absolute top-5 left-0 w-full h-[2px] bg-surface-container-high -z-10" />

      {STEPS.map((label, i) => {
        const step = (i + 1) as Step;
        const isActive = step === current;
        const isDone = step < current;

        return (
          <div key={label} className="flex flex-col items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                isActive
                  ? 'text-white shadow-lg ring-4 ring-white'
                  : isDone
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-outline'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' } : {}}
            >
              {isDone ? (
                <span className="material-symbols-outlined text-base">check</span>
              ) : (
                step
              )}
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                isActive ? 'text-on-surface' : isDone ? 'text-primary' : 'text-outline'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BulkImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    failed?: number;
    rowErrors?: RowError[];
  } | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errorCount = rows.filter((r) => r._status === 'error').length;
  const validCount = rows.filter((r) => r._status === 'valid').length;

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (result) => {
        const seenEmails = new Set<string>();
        const parsed: ParsedRow[] = result.data.map((raw, i) => {
          const row: RawRow = {
            name: raw['name'] ?? '',
            email: raw['email'] ?? '',
            role: raw['role'] ?? '',
            team_name: raw['team_name'] ?? '',
            timezone: raw['timezone'] ?? '',
            manager_email: raw['manager_email'],
            work_week: raw['work_week'],
            available_hours: raw['available_hours'],
            billable_permission: raw['billable_permission'],
          };
          const errors = validateRow(row, i, seenEmails);
          if (row.email?.trim()) seenEmails.add(row.email.trim().toLowerCase());
          return { ...row, _row: i + 1, _status: errors.length ? 'error' : 'valid', _errors: errors };
        });
        setRows(parsed);
        setStep(3);
      },
      error: () => {
        setImportError('Failed to parse CSV. Please check the file format.');
      },
    });
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith('.csv')) {
        parseFile(file);
      } else {
        setImportError('Please upload a .csv file.');
      }
    },
    [parseFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    if (errorCount > 0) return;
    setImporting(true);
    setImportError('');

    try {
      const payload = rows.map((r) => ({
        name: r.name,
        email: r.email,
        role: r.role,
        team_name: r.team_name,
        timezone: r.timezone,
        manager_email: r.manager_email,
        work_week: r.work_week,
        available_hours: r.available_hours,
        billable_permission: r.billable_permission,
      }));

      const res = await fetch('/api/admin/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payload }),
      });

      const data = await res.json();

      if (res.status === 422 || res.status === 400) {
        // Server-side validation errors
        if (data.rowErrors) {
          // Merge server errors back into rows
          const errorMap = new Map<number, string[]>(
            data.rowErrors.map((e: RowError) => [e.row, e.errors])
          );
          setRows((prev) =>
            prev.map((r) => {
              const errs = errorMap.get(r._row);
              if (errs) return { ...r, _status: 'error', _errors: [...r._errors, ...errs] };
              return r;
            })
          );
          setImportError(`${data.rowErrors.length} row(s) failed server validation. Please review and fix.`);
        } else {
          setImportError(data.error ?? 'Import failed');
        }
      } else if (res.ok || res.status === 207) {
        setImportResult({ created: data.created, failed: data.failed, rowErrors: data.failedRows });
        setStep(4);
      } else {
        setImportError(data.error ?? 'Unexpected error during import');
      }
    } catch {
      setImportError('Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render steps
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-surface">
      {/* Ambient shapes */}
      <div className="fixed top-0 right-0 -z-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-40 pointer-events-none translate-x-1/2 -translate-y-1/2"
        style={{ background: 'rgba(77,85,106,0.05)' }} />
      <div className="fixed bottom-0 left-0 -z-20 w-[400px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none -translate-x-1/4 translate-y-1/4"
        style={{ background: 'rgba(120,130,160,0.1)' }} />

      <main className="pb-28 px-4 md:px-8 pt-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Users
            </button>
          </div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Import Your People</h2>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Bring your entire team into Sunday with a simple CSV upload. We&apos;ll handle the heavy
            lifting while you focus on building a better workplace.
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: Instructions                                               */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Instructions card */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-10 shadow-ambient relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="material-symbols-outlined" style={{ fontSize: 96 }}>description</span>
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-6">Preparation Rules</h3>
              <div className="space-y-8">
                {[
                  {
                    icon: 'table_chart',
                    title: 'Standardized Columns',
                    body: 'Your CSV must contain: name, email, role, team_name, timezone. Optional: manager_email, work_week, available_hours, billable_permission.',
                  },
                  {
                    icon: 'alternate_email',
                    title: 'Email Uniqueness',
                    body: 'Every employee must have a unique work email. Duplicates will be flagged during the preview step.',
                  },
                  {
                    icon: 'verified_user',
                    title: 'Data Validation',
                    body: 'Roles must be one of: employee, team_leader, manager, senior_manager, planner, admin. Work week uses abbreviated day names: Mon, Tue, Wed, Thu, Fri, Sat, Sun.',
                  },
                  {
                    icon: 'group_work',
                    title: 'Teams Must Exist',
                    body: 'The team_name field must exactly match a team already created in Sunday. Import all teams first via the Teams section.',
                  },
                ].map(({ icon, title, body }) => (
                  <div key={title} className="flex gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant">
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface mb-1">{title}</h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-4">
                <button
                  onClick={downloadTemplate}
                  className="px-8 py-4 text-white rounded-full font-bold flex items-center gap-3 shadow-lg hover:opacity-90 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
                >
                  <span className="material-symbols-outlined">download</span>
                  Download CSV Template
                </button>
              </div>
            </div>

            {/* Upload zone preview */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-surface-container rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center text-on-surface-variant shadow-sm mb-4">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <p className="font-bold text-on-surface mb-1">Ready to upload?</p>
                <p className="text-xs text-outline px-6">Drag and drop your .csv file here. Max file size is 5MB.</p>
                <button
                  onClick={() => setStep(2)}
                  className="mt-6 text-sm font-bold text-on-surface-variant underline underline-offset-4 decoration-2 hover:text-on-surface transition-colors"
                >
                  Continue to upload
                </button>
              </div>

              <div className="bg-surface-container-high/80 rounded-2xl p-6 flex gap-4">
                <span className="material-symbols-outlined text-on-surface-variant">info</span>
                <div className="text-xs leading-relaxed text-on-surface-variant">
                  <strong className="block mb-1">Pro Tip:</strong>
                  Using our template ensures the highest success rate. Over 90% of failures are due
                  to header mismatch.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: Upload                                                      */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`bg-surface-container-lowest rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-ambient transition-all cursor-pointer ${
                isDragging ? 'bg-surface-container-high' : ''
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg mb-6"
                style={isDragging
                  ? { background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }
                  : { background: 'linear-gradient(135deg, #88909e 0%, #9ca3af 100%)' }}
              >
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <p className="font-bold text-on-surface text-lg mb-2">
                {isDragging ? 'Drop your file here' : 'Drag & drop your CSV file'}
              </p>
              <p className="text-on-surface-variant text-sm mb-6">or click anywhere to browse</p>
              <span className="px-6 py-2 bg-surface-container rounded-full text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                .csv only · max 5MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {importError && (
              <div className="mt-6 p-4 bg-error-container rounded-2xl flex gap-3 text-on-error-container text-sm">
                <span className="material-symbols-outlined text-error">error</span>
                {importError}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 3: Preview                                                     */}
        {/* ------------------------------------------------------------------ */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-4 p-6 bg-surface-container-lowest rounded-2xl shadow-ambient-sm">
              <span className="material-symbols-outlined text-on-surface-variant">insert_drive_file</span>
              <span className="font-medium text-on-surface text-sm">{fileName}</span>
              <span className="ml-auto flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2 text-primary font-bold">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  {validCount} valid
                </span>
                {errorCount > 0 && (
                  <span className="flex items-center gap-2 text-error font-bold">
                    <span className="w-2 h-2 rounded-full bg-error inline-block" />
                    {errorCount} errors
                  </span>
                )}
              </span>
              <button
                onClick={() => { setRows([]); setFileName(''); setStep(2); }}
                className="text-xs text-outline hover:text-on-surface transition-colors"
              >
                Change file
              </button>
            </div>

            {/* Error summary */}
            {errorCount > 0 && (
              <div className="bg-error-container/20 rounded-2xl p-6">
                <h4 className="font-bold text-error mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">error</span>
                  {errorCount} row{errorCount !== 1 ? 's' : ''} need attention
                </h4>
                <div className="space-y-2 text-sm">
                  {rows
                    .filter((r) => r._status === 'error')
                    .map((r) => (
                      <div key={r._row} className="flex gap-3 text-error">
                        <span className="font-bold shrink-0">Row {r._row}:</span>
                        <span className="text-on-error-container">{r._errors.join(' · ')}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {importError && (
              <div className="p-4 bg-error-container rounded-2xl flex gap-3 text-on-error-container text-sm">
                <span className="material-symbols-outlined text-error">error</span>
                {importError}
              </div>
            )}

            {/* Preview table */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-ambient-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-container-low/50 text-xs uppercase tracking-widest text-outline">
                      <th className="px-6 py-4 text-left w-10">#</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-left">Name</th>
                      <th className="px-6 py-4 text-left">Email</th>
                      <th className="px-6 py-4 text-left">Role</th>
                      <th className="px-6 py-4 text-left">Team</th>
                      <th className="px-6 py-4 text-left">Timezone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row._row}
                        className={`transition-colors ${
                          row._status === 'error' ? 'bg-error-container/10' : 'hover:bg-surface-container-low/50'
                        }`}
                      >
                        <td className="px-6 py-4 text-outline">{row._row}</td>
                        <td className="px-6 py-4">
                          {row._status === 'valid' ? (
                            <span className="flex items-center gap-1.5 text-primary font-medium">
                              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              Valid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-error font-medium" title={row._errors.join('\n')}>
                              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-on-surface">{row.name || <span className="text-error/60 italic">missing</span>}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{row.email || <span className="text-error/60 italic">missing</span>}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium capitalize">
                            {row.role || <span className="text-error/60 italic">missing</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{row.team_name || <span className="text-error/60 italic">missing</span>}</td>
                        <td className="px-6 py-4 text-outline text-xs">{row.timezone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 4: Done                                                        */}
        {/* ------------------------------------------------------------------ */}
        {step === 4 && importResult && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl mx-auto mb-8"
              style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
            >
              <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                task_alt
              </span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-3">Import Complete!</h3>
            <p className="text-on-surface-variant text-lg mb-2">
              <span className="font-bold text-on-surface">{importResult.created}</span> users created successfully.
            </p>
            {importResult.failed ? (
              <p className="text-error text-sm mb-6">
                {importResult.failed} row{importResult.failed !== 1 ? 's' : ''} failed and were skipped.
              </p>
            ) : (
              <p className="text-outline text-sm mb-6">Invitation emails will be sent to all imported users.</p>
            )}

            {importResult.rowErrors && importResult.rowErrors.length > 0 && (
              <div className="bg-error-container/20 rounded-2xl p-4 mb-6 text-left text-sm">
                <h4 className="font-bold text-error mb-2">Failed rows:</h4>
                {importResult.rowErrors.map((e) => (
                  <div key={e.row} className="text-on-error-container mb-1">
                    Row {e.row} ({e.email}): {e.errors.join(', ')}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { setStep(1); setRows([]); setFileName(''); setImportResult(null); }}
                className="px-8 py-3 bg-surface-container-high text-on-surface-variant rounded-full font-bold hover:bg-surface-container-highest transition-colors"
              >
                Import More
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="px-8 py-3 text-white rounded-full font-bold shadow-lg hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                View All Users
              </button>
            </div>
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* Bottom action bar                                                    */}
      {/* -------------------------------------------------------------------- */}
      {step !== 4 && (
        <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-surface-container-lowest/90 backdrop-blur-md px-8 py-5 flex items-center justify-between shadow-[0_-8px_24px_rgba(77,85,106,0.04)] z-30">
          <div className="flex items-center gap-3 text-sm text-outline">
            <span className="material-symbols-outlined text-outline">lock</span>
            Secure encrypted data transmission active.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (step === 1) router.push('/admin/users');
                else setStep((s) => (s - 1) as Step);
              }}
              className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="px-10 py-3 text-white rounded-full font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                Continue to Upload
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-3 text-white rounded-full font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                Select CSV File
                <span className="material-symbols-outlined text-sm">upload_file</span>
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleImport}
                disabled={errorCount > 0 || importing}
                className="px-10 py-3 text-white rounded-full font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                {importing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    Import {validCount} User{validCount !== 1 ? 's' : ''}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
