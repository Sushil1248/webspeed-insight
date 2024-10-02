export function formatDateIntelligently(dateString) {
    if(!dateString) return;
    const months = [
      "January", "February", "March", "April", "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];
  
    // Split the input string into date and time parts
    const [datePart, timePart] = dateString.split(", ");
    const [day, month, year] = datePart.split("/").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);
  
    // Create a new Date object
    const dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
  
    // Format the date part
    const monthName = months[dateObj.getMonth()];
    const dayOfMonth = dateObj.getDate();
    const fullYear = dateObj.getFullYear();
  
    // Format the time part with AM/PM
    let hour = dateObj.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert to 12-hour format
    const minute = dateObj.getMinutes().toString().padStart(2, '0');
  
    // Construct the formatted string
    return `${monthName} ${dayOfMonth}, ${fullYear}, ${hour}:${minute} ${ampm}`;
  }