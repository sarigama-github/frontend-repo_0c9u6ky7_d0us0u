import { useEffect, useMemo, useState } from 'react'

function MobileShell({ children, title = 'Lingo Mini' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="mx-4 shadow-xl rounded-3xl bg-white overflow-hidden border border-emerald-100">
          <header className="px-5 py-4 border-b flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <span className="inline-block w-8 h-8 rounded-full bg-emerald-500 text-white grid place-items-center font-bold">L</span>
              <h1 className="text-lg font-bold text-gray-800">{title}</h1>
            </div>
            <a href="/test" className="text-xs text-emerald-700 hover:text-emerald-900">Status</a>
          </header>
          <main className="p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

function Chip({ children, active }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{children}</span>
  )
}

function Button({ children, onClick, variant = 'primary', disabled }) {
  const base = 'w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const styles = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    secondary: 'bg-white border hover:bg-gray-50 text-gray-800',
  }
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>
  )
}

export default function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [exercises, setExercises] = useState([])
  const [step, setStep] = useState('home') // home -> lessons -> play -> result
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [score, setScore] = useState(0)

  useEffect(() => { loadCourses() }, [])

  async function seedDemo() {
    setLoading(true)
    try {
      await fetch(`${baseUrl}/api/seed`, { method: 'POST' })
      await loadCourses()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadCourses() {
    try {
      const res = await fetch(`${baseUrl}/api/courses`)
      const data = await res.json()
      setCourses(data)
      if (data.length > 0) {
        setSelectedCourse(data[0])
        await loadLessons(data[0])
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function loadLessons(course) {
    setLessons([])
    setSelectedLesson(null)
    setExercises([])
    try {
      const res = await fetch(`${baseUrl}/api/courses/${course.id}/lessons`)
      const data = await res.json()
      setLessons(data.sort((a,b) => (a.order||0) - (b.order||0)))
    } catch (e) {
      console.error(e)
    }
  }

  async function startLesson(lesson) {
    setSelectedLesson(lesson)
    setLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/lessons/${lesson.id}/exercises`)
      const data = await res.json()
      setExercises(data)
      setIdx(0)
      setScore(0)
      setAnswer('')
      setResult(null)
      setStep('play')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function submitCurrent() {
    const ex = exercises[idx]
    if (!ex) return
    setLoading(true)
    try {
      const res = await fetch(`${baseUrl}/api/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_id: ex.id, answer })
      })
      const data = await res.json()
      setResult(data)
      if (data.correct) setScore(s => s + 10)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function next() {
    const nextIdx = idx + 1
    if (nextIdx >= exercises.length) {
      setStep('result')
    } else {
      setIdx(nextIdx)
      setAnswer('')
      setResult(null)
    }
  }

  function resetToHome() {
    setStep('home')
    setSelectedLesson(null)
    setExercises([])
    setIdx(0)
    setAnswer('')
    setResult(null)
  }

  // Screens
  const Home = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Choose a course</h2>
        <button onClick={seedDemo} className="text-sm text-emerald-600 hover:text-emerald-800">Seed demo</button>
      </div>

      {courses.length === 0 && (
        <div className="p-4 rounded-xl border bg-gray-50 text-gray-600 text-sm">
          No courses yet. Tap "Seed demo" to create a sample Spanish course.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {courses.map((c) => (
          <button key={c.id} onClick={() => { setSelectedCourse(c); loadLessons(c) }} className={`p-4 rounded-2xl border text-left transition ${selectedCourse?.id===c.id? 'border-emerald-400 bg-emerald-50' : 'hover:bg-gray-50'}`}>
            <div className="text-2xl">🟢</div>
            <div className="font-semibold text-gray-800 mt-1">{c.name}</div>
            <div className="text-xs text-gray-500">{c.code.toUpperCase()}</div>
          </button>
        ))}
      </div>

      {selectedCourse && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Chip active>Course</Chip>
            <span className="font-semibold">{selectedCourse.name}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {lessons.map(ls => (
              <div key={ls.id} className="p-4 border rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Lesson {ls.order}</div>
                  <div className="font-semibold">{ls.title}</div>
                </div>
                <Button onClick={() => startLesson(ls)} disabled={loading}>Start</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const current = exercises[idx]
  const Play = current && (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Chip active>Lesson {selectedLesson?.order}</Chip>
          <span className="text-sm text-gray-600">{idx+1}/{exercises.length}</span>
        </div>
        <div className="font-semibold text-emerald-600">XP {score}</div>
      </div>

      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
        <div className="text-sm text-emerald-700 mb-1 font-semibold uppercase">Question</div>
        <div className="text-lg font-bold text-gray-800">{current.prompt}</div>
      </div>

      {current.type === 'mcq' ? (
        <div className="grid grid-cols-1 gap-3">
          {(current.options || []).map(opt => (
            <button key={opt} onClick={() => setAnswer(opt)} className={`p-4 border rounded-2xl text-left ${answer===opt? 'border-emerald-400 bg-emerald-50' : 'hover:bg-gray-50'}`}>{opt}</button>
          ))}
        </div>
      ) : (
        <input
          className="w-full p-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder="Type your answer"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
      )}

      {!result ? (
        <Button onClick={submitCurrent} disabled={loading || !answer}>Check</Button>
      ) : (
        <div className={`p-4 rounded-2xl border ${result.correct? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {result.correct ? 'Correct! +10 XP' : `Not quite. Answer: ${result.expected}`}
        </div>
      )}

      {result && (
        <Button variant="secondary" onClick={next}>Next</Button>
      )}

      <button onClick={resetToHome} className="block mx-auto text-xs text-gray-500 hover:text-gray-700">Exit lesson</button>
    </div>
  )

  const Result = (
    <div className="space-y-6 text-center">
      <div className="text-5xl">🎉</div>
      <div className="text-2xl font-bold">Great job!</div>
      <div className="text-gray-600">You earned <span className="font-semibold text-emerald-600">{score} XP</span></div>
      <div className="space-y-3">
        <Button onClick={() => startLesson(selectedLesson)}>Retry lesson</Button>
        <Button variant="secondary" onClick={resetToHome}>Back to course</Button>
      </div>
    </div>
  )

  return (
    <MobileShell title="Lingo Mini">
      {step === 'home' && Home}
      {step === 'play' && Play}
      {step === 'result' && Result}
      {loading && (
        <div className="fixed inset-0 bg-black/10 grid place-items-center">
          <div className="px-4 py-2 rounded-xl bg-white shadow">Loading...</div>
        </div>
      )}
    </MobileShell>
  )
}
