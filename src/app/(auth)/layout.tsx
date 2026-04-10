export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Background decorative blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] blur-[120px] rounded-full bg-primary-fixed/30" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] blur-[120px] rounded-full bg-tertiary-fixed/20" />
      </div>
      {children}
    </div>
  )
}
