import React, { useState, useEffect } from 'react';
import '../css/paymentpage.css';
import StepProgressBar from "../components/StepProgressBar";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/BaseURL';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { cartClear } from '../CartSlice';

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customerData, setCustomerData] = useState({});
  const nav = useNavigate();
  const Products = useSelector(state => state.myCart.cartItems)
  let totalAmnt = 0;
  let gst = 0;
  let shippingCharge = 50;
  let absoluteTotal = 0;
  let imageUrl = "";
  let dispatch = useDispatch();
    

  useEffect(() => {
    const delivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setDeliveryDate(delivery.toDateString());
  }, []);

  const loadData = async () =>{
    let api = `${API_URL}/customer/orderData`;
    try {
      let response = await axios.post(api, {cusid : localStorage.getItem("cusid")});
    console.log("response", response.data);
    setCustomerData(response.data);
      
    } catch (error) {
      console.log(error);  
    } 
  }
  const handleProceed = () => {
    if (!paymentMethod) {
      alert('Please select a payment method.');
    } else {
      alert(`Selected payment method: ${paymentMethod}`);
    }
    if(paymentMethod === "razorpay"){
      handleRazorpay();
    }
  };

  let productName = "";
  Products.forEach((key) => {
      productName += key.name + ", ";
      totalAmnt += key.price * key.qnty;
      imageUrl=`${API_URL}${key.defaultImage}`;
    }) 
    
    gst = totalAmnt * 0.12;   
    absoluteTotal = totalAmnt + gst + shippingCharge;



     const initPay = (data) => {
      const options = {
        key : "rzp_test_R2gvLZrvRSdA6y",
        amount: data.amount,
        currency: data.currency,
        name: productName,
        description: "Test",
        image:imageUrl,
        order_id: data.id,
        handler: async (response) => {
          try {
            const verifyURL = "http://localhost:8080/api/payment/verification";
            const {data} = await axios.post(verifyURL,response);
          } catch(error) {
            console.log(error);
          }
        },
        theme: {
          color: "#3399cc",
        },
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    };
   

  const handleRazorpay =async () => {
    
    try {
        const orderURL = "http://localhost:8080/api/payment/customerorders";
        const {data} = await axios.post(orderURL,{amount: absoluteTotal, cusname:customerData.name, address:customerData.address, contact:customerData.number, email:customerData.email, productname:productName});
        console.log(data);
        initPay(data.data);

        dispatch(cartClear());


      } catch (error) {
        console.log(error);
      }
  };

  useEffect(() => {
    loadData();
  }, []);
  return (
    <>
    <StepProgressBar currentStep={2} />
    <div className="btndiv">
         <button className="payment-back-button" onClick={()=>{nav("/checkout")}}><IoMdArrowRoundBack /></button>
         </div>
    <div className="payment-container">
        <div className="section payment-method">
          
          <h3>Select Payment Method</h3>

          <label className="payment-option">
            <input type="radio" name="payment" value="cod" onChange={(e) => setPaymentMethod(e.target.value)}/>
            <img className='payment-image' src="https://icon-library.com/images/cash-on-delivery-icon/cash-on-delivery-icon-8.jpg" alt="" />
            <p>Pay at your doorstap via UPI or Cash</p>
          </label>

          <label className="payment-option">
            <input type="radio" name="payment" value="razorpay" onChange={(e) => setPaymentMethod(e.target.value)}/>
            <img className='razorpay-image' src="https://vectorseek.com/wp-content/uploads/2023/09/Razorpay-with-all-cards-UPI-Logo-Vector.svg-.png" alt="" />
                <p>Pay via Razorpay</p>
          </label>
        </div>

        <div className="section delivery-date">
          <h3>Estimated Delivery</h3>
          <p>Your item will be delivered on: <strong>{deliveryDate}</strong></p>
        </div>

        <button className="proceed-btn" onClick={handleProceed}>
          Proceed to Pay
        </button>
    </div>
    </>
  );
};

export default PaymentPage;
