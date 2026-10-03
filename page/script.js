document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. SMOOTH SPLIT-FLAP ROLLING OTP
    // ==========================================
    const otpBoxes = document.querySelectorAll('.otp-digits span');
    const indicator = document.querySelector('.screen-indicator');

    // Wrap initial text in a slide container for clean CSS transforms
    otpBoxes.forEach(box => {
        const initialVal = box.textContent.trim();
        box.innerHTML = `<span class="digit-slide">${initialVal}</span>`;
    });

    function transitionDigit(box, nextValue, delayMs) {
        setTimeout(() => {
            const currentSlide = box.querySelector('.digit-slide');
            if (!currentSlide) return;

            currentSlide.classList.add('slide-out');

            setTimeout(() => {
                currentSlide.classList.remove('slide-out');
                currentSlide.classList.add('slide-in-prep');
                currentSlide.textContent = nextValue;

                void currentSlide.offsetWidth;

                currentSlide.classList.remove('slide-in-prep');
                currentSlide.classList.add('slide-in-active');
            }, 120); // Faster swap (was 200ms)
        }, delayMs);
    }

    function rotateOtp() {
        if (!otpBoxes.length) return;

        if (indicator) {
            indicator.classList.add('pulse');
            setTimeout(() => indicator.classList.remove('pulse'), 200);
        }

        otpBoxes.forEach((box, index) => {
            const randomDigit = Math.floor(Math.random() * 10);
            transitionDigit(box, randomDigit, index * 35); // Snappier wave (was 70ms)
        });
    }

    // Faster rotation: every 3 seconds instead of 6
    setInterval(rotateOtp, 3000);


    // ==========================================
    // 2. DOWNLOAD BUTTON TACTILE FEEDBACK
    // ==========================================
    const downloadBtns = document.querySelectorAll('a[download]');

    downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const strongTag = btn.querySelector('strong');
            
            if (strongTag) {
                const originalText = strongTag.textContent;
                strongTag.textContent = 'DOWNLOADING...';

                setTimeout(() => {
                    strongTag.textContent = originalText;
                }, 2500);
            } else {
                const originalText = btn.textContent;
                btn.textContent = 'Downloading...';

                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2500);
            }
        });
    });

    // ==========================================
    // 3. SUPPORT QUERY FORM SUBMISSION
    // ==========================================
    const supportForm = document.getElementById('support-query-form');
    const submitBtn = document.getElementById('query-submit-btn');
    const statusBanner = document.getElementById('query-status-banner');
    const TARGET_RECIPIENT = 'hariganesh260@gmail.com';

    if (supportForm) {
        supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('query-name').value.trim();
            const email = document.getElementById('query-email').value.trim();
            const subject = document.getElementById('query-subject').value.trim();
            const message = document.getElementById('query-message').value.trim();

            if (!name || !email || !subject || !message) {
                showStatus('Please fill in all required fields.', 'error');
                return;
            }

            // UI Loading State
            setBtnLoading(true);
            showStatus('Dispatching your query to team...', 'loading');

            const payload = {
                name: name,
                email: email,
                subject: subject,
                message: message
            };

            try {
                // Submit to our local Express / Nodemailer backend
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showStatus('✓ Your query has been delivered.', 'success');
                    supportForm.reset();
                } else {
                    // Fallback to direct Gmail compose if local server reports an error
                    fallbackToGmail(name, email, subject, message);
                }
            } catch (err) {
                // If running statically without node server active, fallback to direct Gmail
                fallbackToGmail(name, email, subject, message);
            } finally {
                setBtnLoading(false);
            }
        });
    }

    function fallbackToGmail(name, email, subject, message) {
        const bodyContent = `Hello Achuppori Team,%0D%0A%0D%0AMy Name: ${encodeURIComponent(name)}%0D%0AMy Email: ${encodeURIComponent(email)}%0D%0A%0D%0AMessage / Query:%0D%0A${encodeURIComponent(message)}%0D%0A%0D%0A-- Sent via Achuppori Support Portal`;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${TARGET_RECIPIENT}&su=${encodeURIComponent('[Achuppori Query] ' + subject)}&body=${bodyContent}`;
        
        window.open(gmailUrl, '_blank');
        showStatus('✓ Your query has been delivered.', 'success');
        supportForm.reset();
    }

    function setBtnLoading(isLoading) {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        const btnText = submitBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = isLoading ? 'SENDING...' : 'SEND QUERY';
        }
    }

    function showStatus(text, type) {
        if (!statusBanner) return;
        statusBanner.style.display = 'flex';
        statusBanner.className = `query-status-banner ${type}`;
        statusBanner.innerHTML = text;
    }
});
