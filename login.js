const toggle = document.getElementById("toggle");
const password = document.getElementById("password");
const email = document.getElementById("email");

toggle.addEventListener("click", () => {

  if(password.type === "password"){
    password.type = "text";
    toggle.textContent = "Hide";
  }
  else{
    password.type = "password";
    toggle.textContent = "Show";
  }
  if(email === "" || password === ""){
   alert("Fill all fields");
}

});