const signupForm = document.getElementById("signupForm");
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword =document.getElementById("confirmPassword").value;
    if(password !== confirmPassword){
        alert("Passwords do not match");
        return;
    }
    try{
        const response = await fetch(
            "http://localhost:8000/signup",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );
        const data = await response.json();
        if(data.success){
            alert("Signup Successful");
            window.location.href = "login.html";
        }else{
            alert(data.message);
        }

    }catch(error){
        console.log(error);
        alert("Server Error");
    }

});