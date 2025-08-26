// BACKGROUND COLOR
function updateColor1a() {
  const colorPicker1a = document.getElementById("colorPicker1a");
  const selectedColor1a = colorPicker1a.value;
  const colorHex1 = document.getElementById("colorHex1");

  document.documentElement.style.setProperty("--background-1", selectedColor1a);
  colorHex1.textContent = `${selectedColor1a}`
}

function updateColor1b() {
  const colorPicker1b = document.getElementById("colorPicker1b");
  const selectedColor1b = colorPicker1b.value;
  const colorHex2 = document.getElementById("colorHex2");

  document.documentElement.style.setProperty("--background-2", selectedColor1b);
  colorHex2.textContent = `${selectedColor1b}`
}

// TEXT COLOR
function updateColor2a() {
  const colorPicker2a = document.getElementById("colorPicker2a");
  const selectedColor2a = colorPicker2a.value;
  const colorHex3 = document.getElementById("colorHex3");

  document.documentElement.style.setProperty("--text", selectedColor2a);
  colorHex3.textContent = `${selectedColor2a}`
}
function updateColor2b() {
  const colorPicker2b = document.getElementById("colorPicker2b");
  const selectedColor2b = colorPicker2b.value;
  const colorHex4 = document.getElementById("colorHex4");

  document.documentElement.style.setProperty("--text-gray", selectedColor2b);
  colorHex4.textContent = `${selectedColor2b}`
}

// PRIMARY COLOR
function updateColor3() {
  const colorPicker3 = document.getElementById("colorPicker3");
  const selectedColor3 = colorPicker3.value;
  const colorHex5 = document.getElementById("colorHex5");

  document.documentElement.style.setProperty("--primary", selectedColor3);
  colorHex5.textContent = `${selectedColor3}`
}

// SECONDARY COLOR
function updateColor4() {
  const colorPicker4 = document.getElementById("colorPicker4");
  const selectedColor4 = colorPicker4.value;
  const colorHex6 = document.getElementById("colorHex6");

  document.documentElement.style.setProperty("--secondary", selectedColor4);
  colorHex6.textContent = `${selectedColor4}`
}

// DANGER COLOR
function updateColor5() {
  const colorPicker5 = document.getElementById("colorPicker5");
  const selectedColor5 = colorPicker5.value;
  const colorHex7 = document.getElementById("colorHex7");

  document.documentElement.style.setProperty("--danger", selectedColor5);
  colorHex7.textContent = `${selectedColor5}`
}
