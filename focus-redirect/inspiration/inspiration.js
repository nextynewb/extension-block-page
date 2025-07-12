document.addEventListener('DOMContentLoaded', () => {
  const quoteElement = document.getElementById('quote');
  const authorElement = document.getElementById('author');
  const goBackButton = document.getElementById('goBack');
  const continueButton = document.getElementById('continueAnyway');
  const reasonContainer = document.getElementById('reason-container');
  const reasonInput = document.getElementById('reason-input');

  const quotes = [
    {
      text: "You do not rise to the level of your goals. You fall to the level of your systems.",
      author: "Atomic Habits - James Clear"
    },
    {
      text: "The compound effect is the principle of reaping huge rewards from a series of small, smart choices.",
      author: "The Compound Effect - Darren Hardy"
    },
    {
      text: "Begin with the end in mind.",
      author: "The 7 Habits of Highly Effective People - Stephen Covey"
    },
    {
      text: "In any moment of decision, the best thing you can do is the right thing, the next best thing is the wrong thing, and the worst thing you can do is nothing.",
      author: "Theodore Roosevelt"
    },
    {
      text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill"
    },
    {
      text: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney"
    },
    {
      text: "Your net worth to the network is your net worth.",
      author: "Tim Sanders"
    },
    {
      text: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.",
      author: "Aristotle"
    },
    {
      text: "The only impossible journey is the one you never begin.",
      author: "Tony Robbins"
    },
    {
      text: "Don't watch the clock; do what it does. Keep going.",
      author: "Sam Levenson"
    },
    {
      text: "Whether you think you can or you think you can't, you're right.",
      author: "Henry Ford"
    },
    {
      text: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt"
    },
    {
      text: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle"
    },
    {
      text: "Success is not how high you have climbed, but how you make a positive difference to the world.",
      author: "Roy T. Bennett"
    },
    {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt"
    },
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs"
    },
    {
      text: "Life is what happens to you while you're busy making other plans.",
      author: "John Lennon"
    },
    {
      text: "Get busy living or get busy dying.",
      author: "Stephen King"
    },
    {
      text: "You have within you right now, everything you need to deal with whatever the world can throw at you.",
      author: "Brian Tracy"
    },
    {
      text: "The difference between ordinary and extraordinary is that little extra.",
      author: "Jimmy Johnson"
    }
  ];

  let currentQuote = 0;
  let countdown = 30;
  let countdownInterval;
  let quoteInterval;

  // Enhanced quote transition with smooth animations
  function displayRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    const quoteContainer = document.querySelector('.quote-container');
    const blockquote = document.getElementById('quote');
    const cite = document.getElementById('author');
    
    // Fade out current quote
    quoteContainer.style.opacity = '0';
    quoteContainer.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      // Update content
      blockquote.textContent = quote.text;
      cite.textContent = `— ${quote.author}`;
      
      // Fade in new quote with stagger effect
      setTimeout(() => {
        quoteContainer.style.opacity = '1';
        quoteContainer.style.transform = 'translateY(0)';
        
        // Animate individual elements
        blockquote.style.opacity = '0';
        cite.style.opacity = '0';
        blockquote.style.transform = 'translateY(15px)';
        cite.style.transform = 'translateY(15px)';
        
        setTimeout(() => {
          blockquote.style.opacity = '1';
          blockquote.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
          cite.style.opacity = '1';
          cite.style.transform = 'translateY(0)';
        }, 300);
        
      }, 100);
    }, 400);
  }

  // Initialize smooth transitions for quote elements
  function initializeQuoteAnimations() {
    const quoteContainer = document.querySelector('.quote-container');
    const blockquote = document.getElementById('quote');
    const cite = document.getElementById('author');
    
    // Add transition styles
    quoteContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    blockquote.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    cite.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  }

  // Start countdown
  function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    const continueBtn = document.getElementById('continueAnyway');
    const reasonContainer = document.getElementById('reason-container');
    
    // Show reason container after 20 seconds
    setTimeout(() => {
      reasonContainer.classList.add('visible');
    }, 20000);
    
    countdownInterval = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        continueBtn.disabled = false;
        continueBtn.textContent = 'Continue Anyway';
        continueBtn.style.background = 'linear-gradient(135deg, #1ee3cf 0%, #4af2e1 100%)';
        continueBtn.style.color = '#0d1b2a';
      }
    }, 1000);
  }

  // Handle go back button
  document.getElementById('goBack').addEventListener('click', () => {
    // Add success animation
    const btn = document.getElementById('goBack');
    btn.style.transform = 'scale(0.95)';
    btn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    btn.textContent = 'Great Choice! 💪';
    
    // Stop quote transitions
    if (quoteInterval) clearInterval(quoteInterval);
    
    setTimeout(() => {
      window.history.back();
    }, 1000);
  });

  // Handle continue anyway button
  document.getElementById('continueAnyway').addEventListener('click', () => {
    const reasonInput = document.getElementById('reason-input');
    const reason = reasonInput.value.trim();
    
    if (reason) {
      // Store the reason (you might want to log this)
      console.log('User reason for continuing:', reason);
      
      // You can add analytics or logging here
      // For now, we'll just allow them to continue
      window.location.href = document.referrer || '/';
    } else {
      // Show validation message
      reasonInput.style.borderColor = '#1ee3cf';
      reasonInput.placeholder = 'Please enter your commitment first...';
      setTimeout(() => {
        reasonInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        reasonInput.placeholder = 'I will work 2x harder on my goals after this...';
      }, 3000);
    }
  });

  // Initialize the page
  initializeQuoteAnimations();
  displayRandomQuote();
  startCountdown();
  
  // Change quote every 10 seconds with enhanced transitions
  quoteInterval = setInterval(displayRandomQuote, 10000);
});

// Handle reason input focus
document.getElementById('reason-input').addEventListener('focus', () => {
  const input = document.getElementById('reason-input');
  input.style.borderColor = '#1ee3cf';
});

document.getElementById('reason-input').addEventListener('blur', () => {
  const input = document.getElementById('reason-input');
  if (!input.value.trim()) {
    input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  }
});