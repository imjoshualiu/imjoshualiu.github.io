if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./serviceWorker.js").then(registration => {
      console.log("SW Registered!");
      console.log(registration);
  }).catch(error => {
      console.log("SW Registration Failed");
      console.log(error);
  });
} 
else {
  console.log("Service Worker not supported");
}

const form = document.getElementById("input_form");

if (form) {
  console.log("Adding event listener");
  form.addEventListener("submit", (event) => {
      event.preventDefault(); // prevent default behavior (??)
      let dataArray = [];
      const picture = document.getElementById("hosts").value;
      const receiver = document.getElementById("receiver").value;
      const receiver_user = document.getElementById("receiver_user").value;
      const amt = document.getElementById("amt").value;
      const desc = document.getElementById("desc").value;
      const phone_model = document.getElementById("phone_model").value;
      dataArray.push({ picture, receiver, receiver_user, amt, desc });
      console.log("Data: ", dataArray);
      window.sessionStorage.setItem("data",JSON.stringify(dataArray)); // session storage values must be strings, so stringify it
      if (phone_model == "reg"){
        window.location.href = './payment/payment_reg.html';
      }
      else{
        window.location.href = './payment/payment.html';
      }
    });
}
else {
  console.log("Form doesn't exist")
}