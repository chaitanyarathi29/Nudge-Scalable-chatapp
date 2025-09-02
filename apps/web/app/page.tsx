'use client'
import { useSocket } from '../context/SocketProvider'
import classes from './page.module.css'
import { useState } from 'react'

export default function Page() {

  const { sendMessage, messages } = useSocket();
  const [ message, setMessage ] = useState('');

  return (
    <div>
      <div>
        <h1>All Messages will appear here</h1>
      </div>
      <div>
        <input onChange={e => setMessage(e.target.value)} type="text" className={classes["chat-input"]} placeholder="Message..." />
        <button onClick={e => sendMessage(message)} className={classes["button"]}>Send</button>
      </div>
      <div>
        {
          messages.map((value,index) => (
            <li key={index}>{value}</li>
          ))
        }
      </div>
    </div>
  )
}