const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const { jsPDF } = require("jspdf");
const html2canvas = require("html2canvas");

const sendEmail = async (to, subject, text, pdfBuffer = null,order) => {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments: pdfBuffer
        ? [{ filename: `${order.orderId}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
        : [],
    };
  
    await transporter.sendMail(mailOptions);
  };
  
  const generatePaymentReceipt = async (order) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    // HTML content for the receipt
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background-color: #f0f0f0; }
          .container { width: 100%; max-width: 600px; margin: auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; background: black; color: white; padding: 20px; }
          .header img { width: 90px; height: 90px; border-radius: 50%; }
          .content { padding: 20px; }
          .order-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .order-details div { flex: 1; }
          .items { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .items th, .items td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
          .items th { background: #f4f4f4; font-weight: bold; }
          .total { text-align: right; margin-top: 20px; }
          .footer { background-color: #f4f4f4; padding: 15px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/djwombdbg/image/upload/f_auto,q_auto/x1ulyjciqb1r38h5c47j" alt="BG Unisex Salon">
            <h2>BG Unisex Salon</h2>
            <p>Order Receipt</p>
          </div>
          <div class="content">
            <div class="order-details">
              <div>
                <p>Order ID: <strong>${order.orderId}</strong></p>
                <p>Customer: <strong>${order.customer.fullName}</strong></p>
                <p>Email: <strong>${order.customer.email}</strong></p>
              </div>
              <div style="text-align: right;">
                <p>Phone: <strong>${order.phone || "Not given"}</strong></p>
                <p>Date: <strong>${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
                <p>Payment Status: <strong>${order.paymentStatus}</strong></p>
              </div>
            </div>
            <table class="items">
              <tr>
                <th style="width: 50%;">Item</th>
                <th style="width: 25%; text-align: center;">Qty</th>
                <th style="width: 25%; text-align: right;">Price</th>
              </tr>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₦${item.price}</td>
                </tr>
              `).join('')}
            </table>
            <div class="total">
              <p>Subtotal: <strong>₦${order.total}</strong></p>
              <p>Shipping Fee: <strong>₦5000</strong></p>
              <p style="font-size: 18px;">Grand Total: <strong>₦${order.total + 5000}</strong></p>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with BG Unisex Salon!</p>
          </div>
        </div>
      </body>
    </html>
    `;
  
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4" });
  
    await browser.close();
    return pdfBuffer;
  };
  
  module.exports={sendEmail,generatePaymentReceipt}