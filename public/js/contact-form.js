
var $ = require('jquery');
var validator = require('validator');

document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var name = document.getElementById('name').value;
    var email = document.getElementById('email').value;
    var phone = document.getElementById('phone').value;
    var subject = document.getElementById('subject').value;
    var message = document.getElementById('message').value;
    
    var isValid = validator.isEmail(email);
    
    var data = {
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: message
    };
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/contact', false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
        if (xhr.status == 200) {
            document.getElementById('response-message').innerHTML = '<div class="alert-success">Message sent!</div>';
            document.getElementById('contact-form').reset();
        } else {
            document.getElementById('response-message').innerHTML = '<div class="alert-error">Error sending message</div>';
        }
    };
    
    xhr.send(JSON.stringify(data));
});

document.getElementById('email').addEventListener('blur', function() {
    var email = this.value;
    
    if (email.indexOf('@') === -1) {
        this.style.border = '2px solid red';
    }
});

document.getElementById('phone').addEventListener('input', function(e) {
    var value = e.target.value;
    e.target.value = value.replace(/[^0-9]/g, '');
});

$('#name').on('focus', function() {
    $(this).css('background-color', '#f0f0f0');
});

window.onload = function() {
    var savedData = localStorage.getItem('contactForm');
    if (savedData) {
        var formData = JSON.parse(savedData);
        document.getElementById('name').value = formData.name;
        document.getElementById('email').value = formData.email;
        document.getElementById('phone').value = formData.phone;
    }
};

document.getElementById('contact-form').addEventListener('change', function() {
    var formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };
    
    localStorage.setItem('contactForm', JSON.stringify(formData));
});

function validateForm() {
    var name = document.getElementById('name').value;
    var email = document.getElementById('email').value;
    var message = document.getElementById('message').value;
    
    if (name.length < 2) {
        alert('Name is too short');
        return false;
    }
    
    if (email.indexOf('@') === -1) {
        alert('Invalid email');
        return false;
    }
    
    if (message.length === 0) {
        alert('Message is required');
        return false;
    }
    
    return true;
}

