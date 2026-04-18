'use client'

import { motion } from 'framer-motion'
import { PAIR_STATE_COLOUR, type PairState } from '@/lib/colours'

interface PairMember {
  name: string
  avatarInitial: string
  completionRate: number
  isSlipping: boolean
}

interface AccountabilityPairWidgetProps {
  partner1: PairMember
  partner2: PairMember
  className?: string
}

function derivePairState(p1: PairMember, p2: PairMember): PairState {
  if (p1.isSlipping && p2.isSlipping) return 'both-slipping'
  if (p1.isSlipping || p2.isSlipping) return 'one-slipping'
  return 'both-on-track'
}

function AvatarRing({ member, state, side }: {
  member: PairMember
  state: PairState
  side: 'left' | 'right'
}) {
  const isSlipping = member.isSlipping
  const ringColour = state === 'both-on-track'
    ? 'ring-integrity'
    : isSlipping
    ? 'ring-energetic'
    : 'ring-integrity'

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          text-lg font-bold text-white ring-3 ${ringColour}
          transition-all duration-200
        `}
        style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
      >
        {member.avatarInitial}
      </motion.div>
      <span className="text-[11px] font-medium text-on-surface truncate max-w-[80px] text-center">
        {member.name}
      </span>
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${
          member.completionRate >= 80 ? 'bg-kindness' :
          member.completionRate >= 50 ? 'bg-energetic' :
          'bg-excitement'
        }`} />
        <span className="text-[10px] text-on-surface-variant">{member.completionRate}%</span>
      </div>
    </div>
  )
}

export default function AccountabilityPairWidget({
  partner1,
  partner2,
  className = '',
}: AccountabilityPairWidgetProps) {
  const pairState = derivePairState(partner1, partner2)
  const stateColour = PAIR_STATE_COLOUR[pairState]

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-[0px_2px_8px_rgba(77,85,106,0.06)] ${className}`}>
      {/* Warning banner for both-slipping */}
      {pairState === 'both-slipping' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 px-3 py-2 rounded-xl bg-excitement-10 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px] text-excitement">warning</span>
          <span className="text-[11px] font-medium text-excitement">
            Both partners are falling behind
          </span>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`material-symbols-outlined text-[18px] ${
          pairState === 'both-on-track' ? 'text-integrity' :
          pairState === 'one-slipping' ? 'text-energetic' :
          'text-excitement'
        }`}>
          group
        </span>
        <span className="text-sm font-semibold text-on-surface">Accountability Pair</span>
      </div>

      {/* Pair avatars */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <AvatarRing member={partner1} state={pairState} side="left" />

        {/* Connector */}
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-0.5 rounded-full ${stateColour.bg}`} />
          <span className={`material-symbols-outlined text-[14px] ${
            pairState === 'both-on-track' ? 'text-integrity' :
            pairState === 'one-slipping' ? 'text-energetic' :
            'text-excitement'
          }`}>
            {pairState === 'both-on-track' ? 'handshake' :
             pairState === 'one-slipping' ? 'priority_high' :
             'warning'}
          </span>
        </div>

        <AvatarRing member={partner2} state={pairState} side="right" />
      </div>

      {/* State label */}
      <div className="text-center">
        <span className={`badge ${stateColour.bg} text-[10px] font-medium ${
          pairState === 'both-on-track' ? 'text-integrity' :
          pairState === 'one-slipping' ? 'text-energetic' :
          'text-excitement'
        }`}>
          {pairState === 'both-on-track' && 'Both on track'}
          {pairState === 'one-slipping' && 'Partner needs support'}
          {pairState === 'both-slipping' && 'Both need attention'}
        </span>
      </div>
    </div>
  )
}
