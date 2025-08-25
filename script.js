// Set current year
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Enhanced loading screen with data theme
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';

        // Start animations after loading
        setTimeout(() => {
            initializeAnimations();
        }, 500);
    }, 2000);
});

// Professional typing animation
const typingTexts = [
    "Data Engineer",
    "IoT Specialist",
    "Technology Educator",
    "Pipeline Designer"
];

let textIndex = 0;
let charIndex = 0;
const typingElement = document.getElementById('typingText');
let isDeleting = false;

function typeText() {
    const currentText = typingTexts[textIndex];

    if (isDeleting) {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
        typeSpeed = 2500; // Pause at end
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        typeSpeed = 300; // Pause before next word
    }

    setTimeout(typeText, typeSpeed);
}

// Initialize animations
function initializeAnimations() {
    typeText();
    animateOnScroll();
}

// Enhanced scroll progress
window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    document.getElementById('scrollProgress').style.width = scrollPercent + '%';

    // Dynamic navbar
    updateNavbar();
    updateActiveSection();
});

// Professional navbar behavior
let lastScroll = 0;
function updateNavbar() {
    const currentScroll = window.pageYOffset;
    const navbar = document.getElementById('navbar');

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Intelligent hide/show based on scroll direction
    if (currentScroll > lastScroll && currentScroll > 500) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    lastScroll = currentScroll;
}

// Active section highlighting
function updateActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Smooth scrolling with offset for fixed navbar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Enhanced intersection observer for animations
function animateOnScroll() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger skill bars animation
                if (entry.target.id === 'skills') {
                    setTimeout(() => animateSkillBars(), 300);
                }
            }
        });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
        observer.observe(el);
    });
}

// Professional skills animation
let skillsAnimated = false;
function animateSkillBars() {
    if (skillsAnimated) return;

    const activeSlide = document.querySelector('#skillsCarousel .carousel-item.active');
    if (activeSlide) {
        animateSkillBarsInSlide(activeSlide);
    }
    skillsAnimated = true;
}

function animateSkillBarsInSlide(slide) {
    const progressBars = slide.querySelectorAll('.skill-progress');
    progressBars.forEach((bar, index) => {
        setTimeout(() => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width + '%';
        }, index * 150);
    });
}

// Carousel skill bar animation
const skillsCarousel = document.getElementById('skillsCarousel');
if (skillsCarousel) {
    skillsCarousel.addEventListener('slid.bs.carousel', function (event) {
        const activeSlide = event.relatedTarget;
        setTimeout(() => animateSkillBarsInSlide(activeSlide), 200);
    });
}

// Professional contact form handling
document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const button = this.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    const formData = new FormData(this);

    // Professional loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    button.disabled = true;
    button.style.background = 'var(--gradient-secondary)';

    // Simulate professional form processing
    setTimeout(() => {
        button.innerHTML = '<i class="fas fa-check-circle me-2"></i>Message Sent Successfully!';
        button.style.background = 'var(--gradient-accent)';

        // Show professional success notification
        showNotification(
            'Thank you for your message! I\'ll review your project details and respond within 24 hours.',
            'success'
        );

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
            button.disabled = false;
            this.reset();
        }, 3000);
    }, 2000);
});

// Professional notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const iconMap = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        info: 'info-circle',
        warning: 'exclamation'
    };

    notification.innerHTML = `
                <i class="fas fa-${iconMap[type]} notification-icon text-${type}"></i>
                <div class="notification-content">
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;

    // Enhanced notification styles
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'});
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-xl);
                z-index: 10001;
                display: flex;
                align-items: flex-start;
                padding: 1.25rem 1.5rem;
                max-width: 400px;
                animation: slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;

    document.body.appendChild(notification);

    // Auto remove with smooth animation
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        setTimeout(() => notification.remove(), 400);
    }, 6000);
}

// Enhanced project card interactions
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-15px) rotateX(2deg)';
        this.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) rotateX(0deg)';
    });
});

// Profile image professional interaction
const profileImg = document.querySelector('.profile-image');
let profileClickCount = 0;

profileImg.addEventListener('click', function () {
    profileClickCount++;

    if (profileClickCount === 1) {
        this.style.animation = 'profileBounce 0.6s ease';
        showNotification(
            'Hello! I\'m glad you\'re exploring my portfolio. Feel free to browse around! 👋',
            'info'
        );
    } else if (profileClickCount === 3) {
        this.style.animation = 'profilePulse 0.8s ease';
        showNotification(
            'Interesting! You seem curious about my work. Check out my projects below! 🚀',
            'info'
        );
    } else if (profileClickCount === 5) {
        this.style.animation = 'profileRotate 1s ease';
        this.style.filter = 'hue-rotate(180deg) saturate(1.2)';
        showNotification(
            '🎉 You found the easter egg! I love working with curious and detail-oriented people like you!',
            'success'
        );

        // Reset after celebration
        setTimeout(() => {
            this.style.filter = '';
            profileClickCount = 0;
        }, 3000);
    }

    // Clear animation
    setTimeout(() => {
        this.style.animation = '';
    }, 1000);
});

// Professional tech badge interactions
document.querySelectorAll('.tech-badge').forEach(badge => {
    badge.addEventListener('mouseenter', function () {
        this.style.background = 'rgba(6, 182, 212, 0.25)';
        this.style.transform = 'translateY(-5px) scale(1.05)';
        this.style.boxShadow = '0 15px 30px rgba(6, 182, 212, 0.25)';
        this.style.borderColor = 'rgba(6, 182, 212, 0.7)';
    });

    badge.addEventListener('mouseleave', function () {
        this.style.background = 'rgba(255, 255, 255, 0.1)';
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = 'none';
        this.style.borderColor = 'rgba(6, 182, 212, 0.3)';
    });

    // Add click interaction for tech details
    badge.addEventListener('click', function () {
        const tech = this.textContent;
        const techInfo = {
            'Python': 'Advanced proficiency in Python for data engineering, including pandas, NumPy, and Apache Airflow.',
            'Apache Airflow': 'Experience building and orchestrating complex data pipelines with scheduling and monitoring.',
            'SQL': 'Expert in database design, optimization, and complex query development across multiple RDBMS.',
            'Machine Learning': 'Applied ML in production environments with focus on predictive analytics and automation.',
            'IoT Systems': 'End-to-end IoT solution development from sensor integration to cloud analytics.',
            'Docker': 'Containerization of data applications and microservices architecture.',
            'AWS': 'Cloud infrastructure management and serverless data processing solutions.',
            'Spark': 'Big data processing and distributed computing for large-scale analytics.'
        };

        if (techInfo[tech]) {
            showNotification(
                `<strong>${tech}:</strong> ${techInfo[tech]}`,
                'info'
            );
        }
    });
});

// Dynamic background based on scroll position
window.addEventListener('scroll', () => {
    const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
    const hue = 220 + (scrollPercent * 60); // Smooth hue transition

    document.documentElement.style.setProperty('--primary', `hsl(${hue}, 70%, 45%)`);
    document.documentElement.style.setProperty('--accent', `hsl(${hue + 40}, 70%, 50%)`);
});

// Performance-optimized particle system for hero section
function createDataParticle() {
    if (document.querySelectorAll('.data-particle').length > 15) return; // Limit particles

    const particle = document.createElement('div');
    particle.className = 'data-particle';
    particle.innerHTML = Math.random() > 0.5 ? '01' : '10'; // Binary data theme

    particle.style.cssText = `
                position: absolute;
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                color: rgba(6, 182, 212, 0.6);
                left: ${Math.random() * 100}%;
                top: 100%;
                pointer-events: none;
                z-index: 1;
                animation: dataFloatUp ${4 + Math.random() * 3}s linear forwards;
            `;

    document.querySelector('.hero').appendChild(particle);
    setTimeout(() => particle.remove(), 7000);
}

// Create data particles periodically
setInterval(createDataParticle, 2000);

// Add professional animation keyframes
const professionalAnimations = document.createElement('style');
professionalAnimations.textContent = `
            @keyframes dataFloatUp {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0.6;
                }
                25% {
                    opacity: 0.8;
                }
                75% {
                    opacity: 0.4;
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
            
            @keyframes profileBounce {
                0%, 20%, 50%, 80%, 100% { 
                    transform: translateY(0) scale(1); 
                }
                40% { 
                    transform: translateY(-10px) scale(1.05); 
                }
                60% { 
                    transform: translateY(-5px) scale(1.02); 
                }
            }
            
            @keyframes profilePulse {
                0% { 
                    transform: scale(1); 
                    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7);
                }
                50% { 
                    transform: scale(1.08); 
                    box-shadow: 0 0 0 20px rgba(6, 182, 212, 0);
                }
                100% { 
                    transform: scale(1); 
                    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0);
                }
            }
            
            @keyframes profileRotate {
                0% { 
                    transform: rotate(0deg) scale(1); 
                }
                25% { 
                    transform: rotate(90deg) scale(1.1); 
                }
                50% { 
                    transform: rotate(180deg) scale(1.2); 
                }
                75% { 
                    transform: rotate(270deg) scale(1.1); 
                }
                100% { 
                    transform: rotate(360deg) scale(1); 
                }
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-message {
                font-weight: 500;
                line-height: 1.5;
            }
        `;
document.head.appendChild(professionalAnimations);

// Enhanced timeline hover effects
document.querySelectorAll('.timeline-content').forEach(content => {
    content.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.02) translateX(10px)';
        this.style.boxShadow = 'var(--shadow-xl)';
    });

    content.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1) translateX(0)';
        this.style.boxShadow = 'var(--shadow)';
    });
});

// Professional console branding
console.log(`
        🚀 Welcome to Renad Amr's Data Engineering Portfolio!
        ═══════════════════════════════════════════════════════════════
        
        💡 Professional Features:
        • Real-time skill animations with progress tracking
        • Interactive project showcases with live demos
        • Professional contact form with validation
        • Responsive design optimized for all devices
        • Performance-optimized animations and interactions
        
        🔧 Technical Stack:
        • Modern HTML5, CSS3 & Vanilla JavaScript
        • Bootstrap 5.3 for responsive framework
        • Custom CSS animations with GPU acceleration
        • Intersection Observer API for performance
        • Professional UX/UI design patterns
        
        📊 Data Engineering Focus:
        • Pipeline architecture visualization
        • IoT integration examples
        • Machine learning project showcases
        • Cloud infrastructure demonstrations
        • Real-world problem-solving examples
        
        🎯 Let's Connect:
        📧 renadamr.bls@gmail.com
        💼 linkedin.com/in/renad-amr
        🐙 github.com/renad29amr
        📱 +20 109 373 8073
        
        ═══════════════════════════════════════════════════════════════
        Built with passion for data engineering and IoT innovation! 🌟
        `);

// Initialize performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            console.log(`⚡ Portfolio loaded in ${loadTime}ms - Optimized for performance!`);
        }, 0);
    });
}

// Professional keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Professional shortcuts for better UX
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                document.querySelector('#home').scrollIntoView({ behavior: 'smooth' });
                break;
            case '2':
                e.preventDefault();
                document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
                break;
            case '3':
                e.preventDefault();
                document.querySelector('#skills').scrollIntoView({ behavior: 'smooth' });
                break;
            case '4':
                e.preventDefault();
                document.querySelector('#projects').scrollIntoView({ behavior: 'smooth' });
                break;
            case '5':
                e.preventDefault();
                document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
                break;
        }
    }
});

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tooltips for better UX
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // Add loading states to external links
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const originalText = link.innerHTML;
            link.innerHTML = '<i class="fas fa-external-link-alt me-1"></i>Opening...';
            setTimeout(() => {
                link.innerHTML = originalText;
            }, 1000);
        });
    });
});

// Enhanced form validation
const formInputs = document.querySelectorAll('.form-control-custom');
formInputs.forEach(input => {
    input.addEventListener('blur', validateInput);
    input.addEventListener('input', clearValidationError);
});

function validateInput(e) {
    const input = e.target;
    const value = input.value.trim();

    // Remove existing validation classes
    input.classList.remove('is-valid', 'is-invalid');

    // Basic validation
    if (input.hasAttribute('required') && !value) {
        input.classList.add('is-invalid');
        showFieldError(input, 'This field is required');
    } else if (input.type === 'email' && value && !isValidEmail(value)) {
        input.classList.add('is-invalid');
        showFieldError(input, 'Please enter a valid email address');
    } else if (value) {
        input.classList.add('is-valid');
        clearFieldError(input);
    }
}

function clearValidationError(e) {
    const input = e.target;
    input.classList.remove('is-invalid');
    clearFieldError(input);
}

function showFieldError(input, message) {
    clearFieldError(input);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback d-block';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
}

function clearFieldError(input) {
    const errorDiv = input.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Professional accessibility enhancements
document.addEventListener('keydown', (e) => {
    // Focus management for better accessibility
    if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
});
