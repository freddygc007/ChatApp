import React, { useContext, useEffect, useRef, useState } from 'react'
import { FormGroup, Form, Row, Col, Button } from 'react-bootstrap'
import './MessageForm.css'
import { useSelector } from 'react-redux';
import { AppContext } from '../context/appContext'

const MessageForm = () => {
  const [message, setMessage] = useState('')
  const user = useSelector(state => state.user)
  const { socket, currentRoom, setMessages, messages, privateMemberMsg } = useContext(AppContext)
  const messageEndRef = useRef(null)
  useEffect(() => {
    scrollToBottom();
  }, [messages])
  function getFormatedDate() {
    const date = new Date();
    const year = date.getFullYear();
    let month = (1 + date.getMonth()).toString();

    month = month.length > 1 ? month : '0' + month;
    let day = date.getDate().toString();

    day = day.length > 1 ? day : '0' + day;
    return month + '/' + day + '/' + year
  }

  function scrollToBottom() {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  function convertTo12HourFormat(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      let hours12 = hours % 12;
    if (hours12 === 0) {
      hours12 = 12; 
    }
  
    const time12 = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  
    return time12;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!message) return;
    const today = new Date();
    const minutes = today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes();
    const time = convertTo12HourFormat(today.getHours() + ":" + minutes);
    const roomId = currentRoom;
    socket.emit('message-room', roomId, message, user, time, todayDate)
    setMessage('')
  }

  const todayDate = getFormatedDate();

  socket.off('room-messages').on('room-messages', (roomMessages) => {
    setMessages(roomMessages)
  })


  return (
    <>
      <div className='messages-output'>
        {user && !privateMemberMsg?._id && <div className='alert alert-info'>You are in the {currentRoom} room</div>}
        {user && privateMemberMsg?._id && (
          <div className='alert alert-info conversation-info'>
            <div>Your conversation with {privateMemberMsg.name} <img src={privateMemberMsg.picture} className='conversation-profile-picture'/></div>
          </div>
        )}
        {!user && <div className='alert alert-danger'>Please login</div>}

        {user &&
          messages.map(({ _id: date, messagesByDate }, idx) => (
            <div key={idx}>
              <p className='alert alert-info text-center message-date-indicator'>{date}</p>
              {messagesByDate?.map(({ content, time, from: sender }, msgIdx) => (
                <div className={sender?.email == user?.email ? "message" : "incomming-message"} key={msgIdx}>
                  <div className='message-inner'>
                    <div className='d-flex align-items-center mb-3'>
                      <img src={sender.picture} style={{ width: 35, height: 35, objectFit: 'cover', borderRadius: '50%', marginRight: 10 }} alt="" />
                      <p className='message-sender'>{sender._id == user?._id ? "You" : sender.name}</p>
                    </div>
                    <div>
                      <p className='message-content'>{content}</p>
                      <p className='message-timestamp-left'>{time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        <div ref={messageEndRef} />
      </div>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={11}>
            <FormGroup>
              <Form.Control type='text' placeholder='Your Message' disabled={!user} value={message} onChange={(e) => setMessage(e.target.value)}></Form.Control>
            </FormGroup>
          </Col>
          <Col md={1}>
            <Button variant='primary' type='submit' style={{ width: '100%', backgroundColor: "orange" }} disabled={!user}>
              <i className='fas fa-paper-plane'></i>
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  )
}

export default MessageForm