import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mystery, setMystery] = useState(null)
  const [screen, setScreen] = useState('intro')
  const [actions, setActions] = useState(0)
  const [askedTopics, setAskedTopics] = useState({})
  const [examinedClues, setExaminedClues] = useState([])
  const [activeSuspect, setActiveSuspect] = useState(null)
  const [lastResponse, setLastResponse] = useState('')
  const [accusedTarget, setAccusedTarget] = useState(null)
  const [notes, setNotes] = useState([])
  const [showCaseFile, setShowCaseFile] = useState(false)
  const [difficulty, setDifficulty] = useState(null)
  const [manualNotes, setManualNotes] = useState('')

  // ─── LOAD MYSTERY ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/mysteries')
      .then(res => res.json())
      .then(data => {
        const m = data.mysteries[data.mysteries.length - 1]
        setMystery(m)
        setActions(m.actions)
      })
  }, [])

  // ─── START GAME ────────────────────────────────────────────────────────────
  function startGame(mode) {
    setDifficulty(mode)
    setScreen('game')
  }

  // ─── SUSPECTS ──────────────────────────────────────────────────────────────
  function selectSuspect(id) {
    setActiveSuspect(id === activeSuspect ? null : id)
    setLastResponse('')
  }

  function askTopic(suspectId, topicId) {
    if (actions <= 0) return
    if (askedTopics[suspectId]?.includes(topicId)) return

    const newAsked = {
      ...askedTopics,
      [suspectId]: [...(askedTopics[suspectId] || []), topicId]
    }
    setAskedTopics(newAsked)

    const suspect = mystery.suspects.find(s => s.id === suspectId)
    const topic = suspect.topics.find(t => t.id === topicId)
    setLastResponse(topic.response)

    if (difficulty === 'rookie') {
      setNotes(prev => [...prev, `${suspect.name}, when asked about ${topic.label.replace('Ask about ', '').replace('Ask ', '')}: "${topic.response}"`])
    }

    setActions(prev => prev - 1)
  }

  // ─── CLUES ─────────────────────────────────────────────────────────────────
  function examineClue(id) {
    if (actions <= 0) return
    if (examinedClues.includes(id)) return

    const clue = mystery.clues.find(c => c.id === id)
    setExaminedClues([...examinedClues, id])
    setLastResponse(clue.response)
    setActiveSuspect(null)

    if (difficulty === 'rookie') {
      setNotes(prev => [...prev, `You examined ${clue.label.toLowerCase()}: "${clue.response}"`])
    }

    setActions(prev => prev - 1)
  }

  // ─── ACCUSATION ────────────────────────────────────────────────────────────
  function accuse(target) {
    setAccusedTarget(target)
    setScreen('result')
  }

  // ─── RESET ─────────────────────────────────────────────────────────────────
  function resetGame() {
    setActions(mystery.actions)
    setAskedTopics({})
    setExaminedClues([])
    setActiveSuspect(null)
    setLastResponse('')
    setAccusedTarget(null)
    setNotes([])
    setManualNotes('')
    setShowCaseFile(false)
    setDifficulty(null)
    setScreen('intro')
  }

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (!mystery) return <div className="game"><p>Loading...</p></div>

  const correct = accusedTarget === mystery.solution
  const usedActions = mystery.actions - actions

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="game">

      {/* INTRO */}
      {screen === 'intro' && (
        <div>
          <div className="tag tag-amber">{mystery.tag}</div>
          <h1>{mystery.title}</h1>
          <p>{mystery.intro}</p>
          <p>{mystery.flavor}</p>
          <div className="card">
            <h3>How to play</h3>
            <p>You have <strong>{mystery.actions}</strong> actions. Question suspects, examine the scene, then make your accusation. Fully questioning one suspect is a commitment — choose wisely.</p>
            <p style={{marginBottom: '0.25rem'}}><strong>Rookie Detective</strong> — Focus on the case. Notes from clues are updated automatically.</p>
            <p style={{marginBottom: 0}}><strong>Chief Inspector</strong> — You're leading this one. No auto-notes — every detail you miss stays missed.</p>
          </div>
          <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
            <button className="btn btn-primary" style={{flex: 1}} onClick={() => startGame('rookie')}> Rookie Detective</button>
            <button className="btn btn-primary" style={{flex: 1}} onClick={() => startGame('chief')}> Chief Inspector</button>
          </div>
        </div>
      )}

      {/* GAME */}
      {screen === 'game' && (
        <div className="game-layout">

          {/* LEFT / TOP — investigation */}
          <div>

            {/* ACTION BAR */}
            <div className="action-bar">
              <div className="actions-left">Actions remaining: <span>{actions}</span></div>
              <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                <button
                  style={{background: 'none', border: 'none', fontSize: '13px', color: '#888', cursor: 'pointer'}}
                  onClick={() => setShowCaseFile(!showCaseFile)}
                >
                  📁 Case file
                </button>
                <button
                  style={{background: 'none', border: 'none', fontSize: '13px', color: '#888', cursor: 'pointer'}}
                  onClick={resetGame}
                >
                  ← Main menu
                </button>
              </div>
            </div>

            {/* CASE FILE DRAWER */}
            {showCaseFile && (
              <div className="card" style={{marginBottom: '1rem', borderLeft: '3px solid #ccc'}}>
                <h3 style={{marginBottom: '0.5rem'}}>{mystery.title}</h3>
                <p style={{marginBottom: '0.5rem'}}>{mystery.intro}</p>
                <p style={{marginBottom: '0.5rem'}}>{mystery.flavor}</p>
                <p style={{fontSize: '13px', color: '#888', marginBottom: 0}}>Victim: {mystery.victim}</p>
              </div>
            )}

            {/* SUSPECTS */}
            <div className="section-label">Suspects</div>
            <div className="suspect-grid">
              {mystery.suspects.map(s => (
                <div
                  key={s.id}
                  className={`suspect-btn ${activeSuspect === s.id ? 'active' : ''}`}
                  onClick={() => selectSuspect(s.id)}
                >
                  <div style={{fontSize: '13px', fontWeight: 500}}>{s.name}</div>
                  <div style={{fontSize: '11px', color: '#888'}}>{s.role.split('.')[0]}</div>
                </div>
              ))}
            </div>

            {/* SUSPECT TOPICS */}
            {activeSuspect && (() => {
              const suspect = mystery.suspects.find(s => s.id === activeSuspect)
              return (
                <div className="card" style={{marginBottom: '1rem'}}>
                  <h3 style={{marginBottom: '0.75rem'}}>{suspect.name}</h3>
                  <p style={{fontSize: '13px', marginBottom: '0.75rem'}}>{suspect.role}</p>
                  {suspect.topics.map(t => {
                    const used = askedTopics[suspect.id]?.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        className="btn"
                        disabled={used}
                        onClick={() => askTopic(suspect.id, t.id)}
                      >
                        {used ? '✓ ' : ''}{t.label}
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {/* RESPONSE */}
            {lastResponse && <div className="response-box">{lastResponse}</div>}

            {/* CLUES */}
            <hr className="divider" />
            <div className="section-label">Examine the scene</div>
            <div className="clue-grid">
              {mystery.clues.map(c => (
                <button
                  key={c.id}
                  className={`clue-btn ${examinedClues.includes(c.id) ? 'examined' : ''}`}
                  onClick={() => examineClue(c.id)}
                  disabled={examinedClues.includes(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* ACCUSE BUTTON */}
            <div style={{marginTop: '2rem'}}>
              <button
                className="btn"
                style={{
                  textAlign: 'center',
                  background: actions === 0 ? '#1a1a1a' : '#f0ede8',
                  color: actions === 0 ? '#fff' : '#888',
                  border: actions === 0 ? 'none' : '1px solid #ddd',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setScreen('accuse')}
              >
                {actions === 0 ? 'Make your accusation' : 'Accuse someone'}
              </button>
            </div>

            {/* NIGHT MODE */}
            <div style={{marginTop: '1rem', textAlign: 'center'}}>
              <button
                style={{background: 'none', border: 'none', fontSize: '12px', color: '#ccc', cursor: 'pointer'}}
                onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
              >
                🌙 night mode
              </button>
            </div>

          </div>

          {/* RIGHT / BOTTOM — notes */}
          <div>
            <div className="section-label">
              Your notes {difficulty === 'chief' && <span style={{fontSize: '11px', color: '#aaa', fontWeight: 400}}>— Chief Inspector mode</span>}
            </div>

            {difficulty === 'rookie' && (
              notes.length === 0
                ? <p style={{fontSize: '13px', color: '#bbb', fontStyle: 'italic'}}>Nothing yet. Start investigating.</p>
                : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {notes.map((note, i) => (
                      <div key={i} style={{
                        fontSize: '13px',
                        color: '#555',
                        lineHeight: '1.6',
                        padding: '0.65rem 0.75rem',
                        background: '#f9f8f5',
                        borderRadius: '6px',
                        borderLeft: '3px solid #ddd'
                      }}>
                        {note}
                      </div>
                    ))}
                  </div>
                )
            )}

            {difficulty === 'chief' && (
              <textarea
                value={manualNotes}
                onChange={e => setManualNotes(e.target.value)}
                placeholder="Your investigation, your notes..."
                style={{
                  width: '100%',
                  minHeight: '300px',
                  fontSize: '13px',
                  lineHeight: '1.7',
                  color: '#444',
                  background: '#f9f8f5',
                  border: '1px solid #e0ddd8',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

        </div>
      )}

      {/* ACCUSE */}
      {screen === 'accuse' && (
        <div>
          <span className="back-link" onClick={() => setScreen('game')}>← back to investigation</span>
          <h2>Make your accusation</h2>
          <p>Who killed {mystery.victim}?</p>
          {mystery.accusations.map(a => (
            <button key={a.id} className="btn btn-accuse" onClick={() => accuse(a.id)}>{a.label}</button>
          ))}
        </div>
      )}

      {/* RESULT */}
      {screen === 'result' && (
        <div>
          <div className={`tag ${correct ? 'tag-teal' : 'tag-red'}`}>{correct ? 'Solved' : 'Wrong'}</div>
          <h1 style={{marginBottom: '0.5rem'}}>{correct ? 'You got it.' : 'Not quite.'}</h1>
          <div className="score-row">
            {Array.from({length: mystery.actions}).map((_, i) => (
              <div key={i} className={`score-dot ${i < usedActions ? (correct ? 'correct' : 'used') : ''}`} />
            ))}
          </div>
          <p>{correct ? 'You read the scene correctly. The clues were there — you found them.' : "The evidence didn't support that accusation — but the truth is still out there."}</p>
          <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
            <button className="btn btn-primary" onClick={resetGame}>
              ← Main menu
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default App