import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { Col, Form, Input, Row,TimePicker,message} from 'antd'
import {useDispatch,useSelector} from 'react-redux'
import {useNavigate,useParams} from 'react-router-dom'

import axios from 'axios'
import { hideLoading, showLoading } from '../../redux/features/alertSlice'
import moment from 'moment'


const Profile = () => {
  const {user}=useSelector(state=>state.user)
  const [doctor, setDoctor]=useState(null);
  const params=useParams()
  const navigate=useNavigate()
  const dispatch=useDispatch()

  //get doctor details
  const getDoctorInfo=async()=>{
    try {
      const res=await axios.post("/api/v1/doctor/getDoctorInfo",{userId:params._id,},
      {
        headers:{
          Authorization:`Bearer ${localStorage.getItem("token")}`
      }
      })
      if(res.data.success){
        setDoctor(res.data.data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(()=>{
    getDoctorInfo();
  },[])

  //handle form
  const handleFinish=async(values)=>{
    try {
        dispatch(showLoading());
        const res=await axios.post("/api/v1/doctor/updateProfile",{...values,userId:user._id,
            timings: [
                moment(values.timings[0]).format("HH:mm"),
                moment(values.timings[1]).format("HH:mm"),
              ]
        },
        {
            headers:{
                Authorization:`Bearer ${localStorage.getItem("token")}`
            }
        })
        dispatch(hideLoading());
        if(res.data.success){
            message.success(res.data.message)
            navigate("/");
        }else{
            message.error(res.data.success)
        }
    } catch (error) {
        dispatch(hideLoading());
        console.log(error)
        message.error("Something went wrong")
    }
}

  return (
    <Layout>
        <h1>Manage Profile</h1>
        {doctor && (
          <Form layout='vertical' onFinish={handleFinish} className='m-3' initialValues={{
            ...doctor,
            timings: [
                moment(doctor.timings[0]).format("HH:mm"),
                moment(doctor.timings[1]).format("HH:mm"),
              ]
          }}>
          <h4 className=''>Personal Details :</h4>
      <Row gutter={20}>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="First Name" name="firstName" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your first name'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Last Name" name="lastName" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your last name'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Phone No" name="phone" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your phone number'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Email" name="email" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your email'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Website" name="website" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your website'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Address" name="address" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your address'/>
              </Form.Item>
          </Col>
      </Row>
      <h4 className=''>Professional Details :</h4>
      <Row gutter={20}>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Specialization" name="specialization" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your specialization'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Experience" name="experience" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your Experience'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="fees" name="fees" required rules={[{required:true}]}>
                  <Input type='text' placeholder='your fees'/>
              </Form.Item>
          </Col>
          <Col xs={24} md={24} lg={8}>
              <Form.Item label="Timings" name="timings" >
                  {/* <TimePicker.RangePicker format="HH:mm" /> */}
              </Form.Item>
          </Col >
          <Col xs={24} md={24} lg={8}></Col>
          <Col xs={24} md={24} lg={8}>
          <button className='btn btn-primary form-btn' type='submit'>Update</button>
          </Col>
      </Row>
  </Form>
        )}
    </Layout>
  )
}

export default Profile