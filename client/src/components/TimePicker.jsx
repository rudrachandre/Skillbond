import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

// "14:05" (24h) -> { hour: 2, minute: "05", period: "PM" }
const to12Hour = (value) => {
  const [rawHour, minute] = (value || '').split(':')
  const hour = parseInt(rawHour, 10)
  if (Number.isNaN(hour)) return { hour: 12, minute: '00', period: 'AM' }
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return { hour: hour12, minute: minute?.padStart(2, '0') || '00', period }
}

// { hour: 2, minute: "05", period: "PM" } -> "14:05" (24h)
const to24Hour = ({ hour, minute, period }) => {
  const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0)
  return `${String(hour24).padStart(2, '0')}:${minute}`
}

function ScrollColumn({ label, options, onSelect, selected }) {
  const listRef = useRef(null)

  // When the dropdown opens, bring the currently selected value into view.
  useEffect(() => {
    const list = listRef.current
    const selectedEl = list?.querySelector('[data-selected="true"]')
    if (list && selectedEl) {
      list.scrollTop = selectedEl.offsetTop - list.clientHeight / 2 + selectedEl.clientHeight / 2
    }
  }, [])

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <span className="shrink-0 text-center text-[0.6rem] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <div ref={listRef} className="mt-0.5 h-[140px] overflow-y-auto border-t border-slate-100">
        {options.map((option) => {
          const isSelected = String(option) === String(selected)
          return (
            <button
              className={`flex min-h-[32px] w-full items-center justify-center px-2 py-1 text-center text-xs transition ${
                isSelected ? 'bg-slate-950 font-bold text-white' : 'text-slate-700 hover:bg-slate-50'
              }`}
              data-selected={isSelected || undefined}
              key={option}
              onClick={() => onSelect(option)}
              type="button"
            >
              {isSelected && <Check size={12} className="mr-0.5 inline" />}
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimePicker({ onChange, value }) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const { hour, minute, period } = to12Hour(value)

  const commit = (nextHour, nextMinute, nextPeriod) => {
    onChange(to24Hour({ hour: nextHour, minute: nextMinute, period: nextPeriod }))
  }

  // Close the dropdown when the user clicks/taps outside of it.
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        className="field-input flex w-full items-center justify-between text-left"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{`${hour}:${minute} ${period}`}</span>
        <ChevronDown className="text-slate-400" size={16} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 flex w-full gap-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <ScrollColumn label="Hour" onSelect={(nextHour) => commit(nextHour, minute, period)} options={HOURS} selected={hour} />
          <ScrollColumn label="Minute" onSelect={(nextMinute) => commit(hour, nextMinute, period)} options={MINUTES} selected={minute} />
          <ScrollColumn label="Period" onSelect={(nextPeriod) => commit(hour, minute, nextPeriod)} options={['AM', 'PM']} selected={period} />
        </div>
      )}
    </div>
  )
}

export default TimePicker