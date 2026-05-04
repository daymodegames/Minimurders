import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mystery, setMystery] = useState(null)
  const [screen, setScreen] = useState('intro')

  // Actions
  const [actions, setActions] = useState(0)
  const [totalActionsUsed, setTotalActionsUsed] = useState(0)

  // Investigation state
  const [askedTopics, setAskedTopics] = useState({})
  const [examinedClues, setExaminedClues] = useState([])
  const [activeSuspect, setActiveSuspect] = useState(null)
  const [lastResponse, setLastResponse] = useState('')

  // Accusation selections
  const [selectedWho, setSelectedWho] = useState(null)
  const [selectedHow, setSelectedHow] = useState(null)
  const [selectedWhy, setSelectedWhy] = useState(null)

  // Attempt tracking
  const [attempt, setAttempt] = useState(1) // 1 or 2
  const [wrongFields, setWrongFields] = useState(null) // { who, how, why } booleans after attempt 1

  // Resolution
  const [solved, setSolved] = useState(false)

  // Notes
  const [notes, setNotes] = useState([])
  const [showCaseFile, setShowCaseFile] = useState(false)
  const [difficulty, setDifficulty] = useState(null)
  const [manualNotes, setManualNotes] = useState('')

  // Share
  const [copied, setCopied] = useState(false)

  // ─── LOAD MYSTERY ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/mysteries')
      .then(res => res.json())
      .then(data => {
        const m = data.mysteries[data.mysteries.length - 1]
        setMystery(m)
        setActions(m.actions)
      })
  }, [])

  // ─── START GAME ──────────────────────────────────────────────────────────
  function startGame(mode) {
    setDifficulty(mode)
    setScreen('game')
  }

  // ─── SUSPECTS ────────────────────────────────────────────────────────────
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
    setTotalActionsUsed(prev => prev + 1)
  }

  // ─── CLUES ───────────────────────────────────────────────────────────────
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
    setTotalActionsUsed(prev => prev + 1)
  }

  // ─── SUBMIT ACCUSATION ───────────────────────────────────────────────────
  function submitAccusation() {
    const whoCorrect = selectedWho?.id === mystery.solution
    const howCorrect = selectedHow?.correct === true
    const whyCorrect = selectedWhy?.correct === true
    const allCorrect = whoCorrect && howCorrect && whyCorrect

    if (allCorrect) {
      setSolved(true)
      setScreen('result')
      return
    }

    if (attempt === 2) {
      // Second attempt failed — show resolution anyway, no win
      setSolved(false)
      setScreen('result')
      return
    }

    // First attempt failed — mark wrong fields, give 3 bonus actions, back to investigation
    setWrongFields({ who: whoCorrect, how: howCorrect, why: whyCorrect })

    // Clear wrong selections, keep correct ones
    if (!whoCorrect) setSelectedWho(null)
    if (!howCorrect) setSelectedHow(null)
    if (!whyCorrect) setSelectedWhy(null)

    setAttempt(2)
    setActions(prev => prev + 3)
    setScreen('second_chance')
  }

  // ─── COPY SHARE ──────────────────────────────────────────────────────────
  function copyShare() {
    const text = `Daymode Games #${mystery.id} — Solved in ${totalActionsUsed} action${totalActionsUsed !== 1 ? 's' : ''} 🕵️`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ─── RESET ───────────────────────────────────────────────────────────────
  function resetGame() {
    setActions(mystery.actions)
    setTotalActionsUsed(0)
    setAskedTopics({})
    setExaminedClues([])
    setActiveSuspect(null)
    setLastResponse('')
    setSelectedWho(null)
    setSelectedHow(null)
    setSelectedWhy(null)
    setAttempt(1)
    setWrongFields(null)
    setSolved(false)
    setNotes([])
    setManualNotes('')
    setShowCaseFile(false)
    setDifficulty(null)
    setCopied(false)
    setScreen('intro')
  }

  // ─── LOADING ─────────────────────────────────────────────────────────────
  if (!mystery) return <div className="game"><p>Loading...</p></div>

  const allSelected = selectedWho && selectedHow && selectedWhy
  const whoOptions = mystery.accusations.map(a => ({ id: a.id, label: a.label }))

  // ─── SELECTOR CARD ───────────────────────────────────────────────────────
  function SelectorCard({ title, options, selected, onSelect, wasWrong }) {
    return (
      <div className="card" style={{
        marginBottom: '1rem',
        borderLeft: wasWrong ? '3px solid #791F1F' : '0.5px solid #D3D1C7'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem'
        }}>
          <div className="section-label" style={{marginBottom: 0}}>{title}</div>
          {wasWrong && (
            <span style={{fontSize: '11px', color: '#791F1F', fontWeight: 500}}>
              Needs revision
            </span>
          )}
        </div>
        {options.map(o => {
          const isSelected = selected?.id === o.id
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.65rem 1rem',
                marginBottom: '0.4rem',
                fontSize: '14px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: isSelected ? '#2C2C2A' : 'rgba(255,255,255,0.7)',
                color: isSelected ? '#FAC775' : '#2C2C2A',
                border: isSelected ? 'none' : '0.5px solid #D3D1C7',
                fontWeight: isSelected ? 500 : 400,
              }}
            >
              {isSelected ? '✓ ' : ''}{o.label}
            </button>
          )
        })}
      </div>
    )
  }

  // ─── GAME SCREEN (shared) ─────────────────────────────────────────────────
  const gameScreen = (
    <div className="game-layout">
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
          const allTopicsAsked = suspect.topics.every(t => askedTopics[suspect.id]?.includes(t.id))
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
              {allTopicsAsked && (
                <p style={{
                  fontSize: '12px',
                  color: '#aaa',
                  fontStyle: 'italic',
                  marginTop: '0.75rem',
                  marginBottom: 0
                }}>
                  They've said everything they're going to say. Whether that's everything they know — that's another matter.
                </p>
              )}
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

      {/* RIGHT — notes */}
      <div>
        <div className="section-label">
          Your notes {difficulty === 'chief' && <span style={{fontSize: '11px', color: '#aaa', fontWeight: 400}}>— Chief Inspector mode</span>}
        </div>

        {difficulty === 'rookie' && (
          notes.length === 0
            ? <p style={{fontSize: '13px', color: '#bbb', fontStyle: 'italic'}}>Nothing yet. Start investigating.</p>
            : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                {[...notes].reverse().map((note, i) => (
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
  )

  // ─── RENDER ──────────────────────────────────────────────────────────────
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
            <p>You have <strong>{mystery.actions}</strong> actions. Question suspects, examine the scene — then name the killer, the method, and the motive. You need all three.</p>
            <p style={{marginBottom: '0.25rem'}}><strong>Rookie Detective</strong> — Focus on the case. Notes from clues are updated automatically.</p>
            <p style={{marginBottom: 0}}><strong>Chief Inspector</strong> — You're leading this one. No auto-notes — every detail you miss stays missed.</p>
          </div>
          <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
            <button className="btn btn-primary" style={{flex: 1}} onClick={() => startGame('rookie')}>Rookie Detective</button>
            <button className="btn btn-primary" style={{flex: 1}} onClick={() => startGame('chief')}>Chief Inspector</button>
          </div>
        </div>
      )}

      {/* GAME */}
      {screen === 'game' && gameScreen}

      {/* ACCUSATION SCREEN */}
      {screen === 'accuse' && (
        <div>
          <span className="back-link" onClick={() => setScreen('game')}>← back to investigation</span>
          <div style={{fontSize: '13px', color: '#888', marginTop: '0.5rem', marginBottom: '1.5rem'}}>
            {actions} action{actions !== 1 ? 's' : ''} remaining
          </div>
          <h2 style={{marginBottom: '0.25rem'}}>Make your accusation</h2>
          <p style={{marginBottom: '1.5rem'}}>Name the killer, the method, and the motive.</p>

          <SelectorCard
            title="WHO — The killer"
            options={whoOptions}
            selected={selectedWho}
            onSelect={o => setSelectedWho(o)}
            wasWrong={wrongFields ? wrongFields.who === false : false}
          />
          <SelectorCard
            title="HOW — The method"
            options={mystery.howOptions}
            selected={selectedHow}
            onSelect={o => setSelectedHow(o)}
            wasWrong={wrongFields ? wrongFields.how === false : false}
          />
          <SelectorCard
            title="WHY — The motive"
            options={mystery.whyOptions}
            selected={selectedWhy}
            onSelect={o => setSelectedWhy(o)}
            wasWrong={wrongFields ? wrongFields.why === false : false}
          />

          {allSelected && (
            <button
              className="btn btn-accuse"
              style={{marginTop: '0.5rem', textAlign: 'center'}}
              onClick={submitAccusation}
            >
              Submit accusation
            </button>
          )}
        </div>
      )}

      {/* SECOND CHANCE SCREEN */}
      {screen === 'second_chance' && (
        <div style={{textAlign: 'center', paddingTop: '3rem'}}>
          <div className="tag tag-amber">Not quite, Detective</div>
          <h1 style={{marginBottom: '0.75rem'}}>Your case has holes.</h1>
          <p style={{
            maxWidth: '380px',
            margin: '0 auto 1rem auto',
            color: '#555',
            fontStyle: 'italic'
          }}>
            {[
              !wrongFields?.who && 'The killer',
              !wrongFields?.how && 'The method',
              !wrongFields?.why && 'The motive'
            ].filter(Boolean).join(', ')} {[!wrongFields?.who, !wrongFields?.how, !wrongFields?.why].filter(Boolean).length > 1 ? 'are' : 'is'} wrong.
          </p>
          <p style={{
            maxWidth: '380px',
            margin: '0 auto 2rem auto',
            color: '#888',
            fontSize: '13px'
          }}>
            You have 3 more actions to patch them. This is your last shot.
          </p>
          <button
            className="btn btn-primary"
            style={{maxWidth: '260px', margin: '0 auto', textAlign: 'center'}}
            onClick={() => setScreen('game')}
          >
            Back to the investigation
          </button>
        </div>
      )}

      {/* RESULT */}
      {screen === 'result' && (
        <div style={{paddingTop: '2rem'}}>

          {/* HEADER */}
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div className={`tag ${solved ? 'tag-teal' : 'tag-red'}`}>
              {solved ? 'Case closed' : 'Case unsolved'}
            </div>
            <h1>{solved ? 'You got it.' : 'The case beat you.'}</h1>
          </div>

          {/* RESOLUTION */}
          {mystery.resolution && (
            <div style={{
              maxWidth: '580px',
              margin: '0 auto 2rem auto',
              background: 'rgba(255,255,255,0.82)',
              border: '0.5px solid #D3D1C7',
              borderRadius: '10px',
              padding: '1.5rem',
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 500,
                color: '#888780',
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                marginBottom: '0.75rem'
              }}>
                What happened
              </div>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.9',
                color: '#2C2C2A',
                fontFamily: 'Georgia, serif',
                marginBottom: 0
              }}>
                {mystery.resolution}
              </p>
            </div>
          )}

          {/* SHARE — only if solved */}
          {solved && (
            <div style={{textAlign: 'center', marginBottom: '2rem'}}>
              <div style={{
                fontSize: '13px',
                color: '#888',
                fontFamily: 'Georgia, serif',
                marginBottom: '0.5rem'
              }}>
                Daymode Games #{mystery.id} — Solved in {totalActionsUsed} action{totalActionsUsed !== 1 ? 's' : ''} 🕵️
              </div>
              <button
                className="btn btn-primary"
                style={{maxWidth: '200px', margin: '0 auto', textAlign: 'center'}}
                onClick={copyShare}
              >
                {copied ? '✓ Copied!' : 'Copy result'}
              </button>
            </div>
          )}

          <div style={{textAlign: 'center'}}>
            <button
              className="btn"
              style={{maxWidth: '200px', margin: '0 auto', textAlign: 'center'}}
              onClick={resetGame}
            >
              ← Main menu
            </button>
          </div>

        </div>
      )}

    </div>
  )
}

export default App