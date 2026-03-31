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

  // ─── LOAD MYSTERY ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/mysteries.json')
      .then(res => res.json())
      .then(data => {
  const mysteries = data.mysteries
  const start = new Date('2026-04-01') // your launch date
  const today = new Date()
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const index = daysSinceStart % mysteries.length
  const m = mysteries[index]
  setMystery(m)
  setActions(m.actions)
      })
  }, [])

  // ─── ACTIONS ───────────────────────────────────────────────────────────────
  function handleActionUse(newActions) {
    if (newActions <= 0) setScreen('accuse')
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

    const newActions = actions - 1
    setActions(newActions)
    handleActionUse(newActions)
  }

  // ─── CLUES ─────────────────────────────────────────────────────────────────
  function examineClue(id) {
    if (actions <= 0) return
    if (examinedClues.includes(id)) return

    const clue = mystery.clues.find(c => c.id === id)
    setExaminedClues([...examinedClues, id])
    setLastResponse(clue.response)
    setActiveSuspect(null)

    const newActions = actions - 1
    setActions(newActions)
    handleActionUse(newActions)
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
            <p style={{marginBottom: 0}}>You have <strong>{mystery.actions}</strong> actions. Question suspects, examine the scene, then make your accusation. Fully questioning one suspect is a commitment — choose wisely.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setScreen('game')}>Begin investigation</button>
        </div>
      )}

      {/* GAME */}
      {screen === 'game' && (
        <div>
          <div className="action-bar">
            <div className="actions-left">Actions remaining: <span>{actions}</span></div>
            <button className="btn btn-small" onClick={() => setScreen('accuse')}>Accuse someone</button>
          </div>

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

          {/* SUSPECT TOPICS — expands inline when a suspect is selected */}
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
          <button className="btn btn-primary" style={{marginTop: '0.5rem'}} onClick={resetGame}>
            {correct ? 'Play again' : 'Try again'}
          </button>
        </div>
      )}

    </div>
  )
}

export default App