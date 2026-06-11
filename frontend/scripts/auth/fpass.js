const forgotForm = document.getElementById("forgotForm");

forgotForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
    document.getElementById("email").value;

    try {

        const response = await fetch(
            `${API_BASE_URL}/forgot-password`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email
                })
            }
        );

        const data = await response.json();

        alert(data.message);

    } catch (error) {

        console.log(error);

        alert("Server Error");

    }

});