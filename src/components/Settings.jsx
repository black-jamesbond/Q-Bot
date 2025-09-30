import { useState } from 'react'
import './Settings.css'

function Settings({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState(null)

  if (!isOpen) return null

  const settingsOptions = [
    {
      id: 'profile',
      title: 'Profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      description: 'Manage your account and personal information'
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
      description: 'Customize your chat experience and behavior'
    },
    {
      id: 'display',
      title: 'Display',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      description: 'Adjust theme, font size, and visual settings'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      description: 'Control notification preferences and alerts'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      description: 'Manage data privacy and security settings'
    },
    {
      id: 'about',
      title: 'About',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"></path>
          <path d="M12 17h.01"></path>
        </svg>
      ),
      description: 'App information, version, and support'
    }
  ]

  const handleOptionClick = (optionId) => {
    setActiveSection(optionId)
    // For now, just show an alert. Later we can implement actual settings pages
    alert(`Opening ${optionId} settings...`)
  }

  return (
    <div className="settings-overlay">
      <div className="settings-container">
        <div className="settings-header">
          <button className="back-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back
          </button>
          <h2 className="settings-title">Settings</h2>
        </div>

        <div className="settings-content">
          <div className="settings-list">
            {settingsOptions.map((option) => (
              <button
                key={option.id}
                className="settings-option"
                onClick={() => handleOptionClick(option.id)}
              >
                <div className="option-icon">
                  {option.icon}
                </div>
                <div className="option-content">
                  <h3 className="option-title">{option.title}</h3>
                  <p className="option-description">{option.description}</p>
                </div>
                <div className="option-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
