import '@/app.scoped.less'
import React, {useState} from 'react'

import './second.scoped.less'

function App() {
    const [count, setCount] = useState(0)
    const cls = 'btn'

    return (
        <div className="app">
            <div className="header">
                <button onClick={() => setCount((count) => count + 1)}>
                    {count}
                    {(() => {
                        return <div className={'inner' + cls}>
                            <p className={cls}>第一个</p>
                        </div>
                    })()}
                </button>

                <Home/>
            </div>
        </div>
    )
}


function Home() {
    return <>
        <header className='home header'>hi</header>
    </>
}

export default App
