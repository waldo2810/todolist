const checkbox = document.querySelector(".checkbox");
const form = document.querySelector(".trash-form");

checkbox.addEventListener("click", () => {
  form.style.visibility = "visible";
  console.log("working");
});
