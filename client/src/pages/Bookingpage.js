import React,{useState,useEffect} from 'react'
import Layout from '../components/Layout'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { DatePicker, TimePicker, message } from 'antd'
import moment from 'moment'
import { useDispatch,useSelector } from 'react-redux'
import { hideLoading, showLoading } from '../redux/features/alertSlice'

const Bookingpage = () => {
    const params=useParams()
    const [doctor,setDoctor]=useState([])
    const [date,setDate]=useState("")
    const [time,setTime]=useState()
    const [isAvailable,setIsAvailable]=useState(false)
    const dispatch=useDispatch()
    const {user}=useSelector(state=>state.user)

    //login user data
    const getDoctorData=async()=>{
      try {
        const res=await axios.post('/api/v1/doctor/getDoctorById',{doctorId:params.doctorId},{
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
    };

    // handle Booking
    const handleBooking=async()=>{
        try {
          setIsAvailable(true)
          if(!date && !time){
            return alert("Date & time Required")
          }
            dispatch(showLoading())
            const res= await axios.post("/api/v1/user/book-appointment",{doctorId:params.doctorId,userId:user._id,doctorInfo:doctor,userInfo:user,date:date,time:time},{
                headers:{
                    Authorization:`Bearer ${localStorage.getItem("token")}`
                  }
            })
            dispatch(hideLoading())
            if(res.data.success){
                message.success(res.data.message)
            }
        } catch (error) {
            dispatch(hideLoading())
            console.log(error)
        }
    }

    //booking availability
    const handleAvailability=async()=>{
      try {
        dispatch(showLoading())
        const res=await axios.post("/api/v1/user/booking-availability",{doctorId:params.doctorId,date,time},{
          headers:{
            Authorization:`Bearer ${localStorage.getItem("token")}`
          }
        })
        dispatch(hideLoading())
        if(res.data.success){
          setIsAvailable(true)
          message.success(res.data.message)
        }else{
          message.error(res.data.message)
        }
      } catch (error) {
        dispatch(hideLoading())
        console.log(error)
      }
    }

    useEffect(()=>{
        getDoctorData();
    },[])
  return (
    <Layout>
        <h3>Booking page</h3>
        <div className="container m-2">
            {doctor &&(
                <div>
                    <h4> Dr.{doctor.firstName} {doctor.lastName}</h4>
                    <h4> Fees : {doctor.fees}</h4>
                    <h4>  Timings : {doctor.timings && doctor.timings[0]} -{" "}
                      {doctor.timings && doctor.timings[1]}{" "}
                    </h4>
                    <div className="d-flex flex-column w-50">
                        <DatePicker format="DD-MM-YYYY" onChange={(value)=>{
                          setDate(moment(value).format("DD-MM-YYYY"))}}/>
                        <TimePicker format="HH:mm" onChange={(value)=>{
                          setTime(moment(value).format("HH:mm"))
                        }}/>
                        <button className='btn btn-primary mt-2' onClick={handleAvailability}>
                            Check Availability
                        </button>
                        {!isAvailable && (
                          <button className='btn btn-dark mt-2' onClick={handleBooking}>
                          Book Now
                      </button>
                        )}
                    </div>
                </div>
               
            )}
        </div>
    </Layout>
  )
}

export default Bookingpage