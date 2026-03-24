import { useState } from 'react'
import { sendBuddyAlert as postBuddyAlert } from '../services/api'
import './RoutePlanner.css'

const PH_REGEX = /^\+639\d{9}$/

export default function BuddyAlert({
  routeContext,
  disabled,
}) {
  const [buddyPhone, setBuddyPhone] = useState('')
  const [userName, setUserName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSendAlert = async () => {
    if (!userName.trim()) {
      alert('Please enter your name')
      return
    }
    if (!buddyPhone.trim()) {
      alert('Please enter your buddy phone number')
      return
    }
    const normalized = buddyPhone.replace(/\s/g, '')
    if (!PH_REGEX.test(normalized)) {
      alert('Phone must be in format: +639XXXXXXXXX')
      return
    }

    setSending(true)
    try {
      await postBuddyAlert({
        user_name: userName.trim(),
        current_lat: routeContext?.start?.lat ?? 14.5995,
        current_lng: routeContext?.start?.lng ?? 121.0175,
        current_address: routeContext?.startLabel || 'Metro Manila',
        destination: routeContext?.endLabel || 'Destination',
        buddy_phone: normalized,
      })
      setShowModal(false)
      setBuddyPhone('')
      alert('Alert sent successfully. Your buddy has been notified.')
    } catch (err) {
      const d = err.response?.data?.detail
      alert(
        'Failed to send alert: ' +
          (typeof d === 'string' ? d : err.message || 'Please try again.')
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-danger"
        style={{ width: '100%', marginTop: '8px' }}
        onClick={() => setShowModal(true)}
        disabled={disabled}
        id="buddy-alert-btn"
        aria-label="Send emergency SMS to a buddy with your location"
      >
        🆘 Alert Emergency Buddy
      </button>

      {showModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buddy-alert-title"
          onClick={() => !sending && setShowModal(false)}
        >
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 id="buddy-alert-title">🆘 Send Buddy Alert</h3>
            <p>
              Your buddy will receive an SMS with your start location and destination.
            </p>

            <div className="field">
              <label className="field-label" htmlFor="buddy-name-input">
                Your name
              </label>
              <input
                id="buddy-name-input"
                className="input"
                placeholder="e.g. Maria Santos"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                autoComplete="name"
                aria-label="Your name"
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="buddy-phone-input">
                Buddy phone (Philippines)
              </label>
              <input
                id="buddy-phone-input"
                className="input"
                type="tel"
                placeholder="+639XXXXXXXXX"
                value={buddyPhone}
                onChange={e => setBuddyPhone(e.target.value)}
                autoComplete="tel"
                aria-label="Buddy phone number"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-glass"
                onClick={() => setShowModal(false)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleSendAlert}
                disabled={sending}
              >
                {sending ? 'Sending…' : 'Send alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
