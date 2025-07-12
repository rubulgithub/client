import React from 'react'
import '../styles/RegisterStyles.css'
import { Form, Input ,message} from "antd";
import {useDispatch} from "react-redux"
import { showLoading,hideLoading } from '../redux/features/alertSlice';
import axios from 'axios';
import { Link ,useNavigate} from "react-router-dom"

const Login = () => {
  const navigate=useNavigate();
  const dispatch=useDispatch();

  const onFinishHandler=async(values)=>{
    try {
      dispatch(showLoading());
      const res=await axios.post("/api/v1/user/login",values)
      window.location.reload();
      dispatch(hideLoading());
      if(res.data.success){
        message.success("login Successfully")
        localStorage.setItem("token",res.data.token);
        navigate("/")
      }else{
        message.error(res.data.message)
      }
    } catch (error) {
      dispatch(hideLoading());
      console.log(error)
      message.error("Something went wrong")
    }
  }
  return (
    <>
    <div className="form-container">
    <Form layout='vertical' onFinish={onFinishHandler} className='register-form'>
      <h3 className='text-center'>Login Form</h3>
      <Form.Item label="Email" name="email">
        <Input type='email' required/>
      </Form.Item>
      <Form.Item label="Password" name="password">
        <Input type='password' required/>
      </Form.Item>
      <Link to="/register" className='m-2' >Not a user login here</Link>
      <button className='btn btn-primary' type='submit'>Login</button>
    </Form>
   </div>
    </>
  )
}

export default Login