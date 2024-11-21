const motion = window.Motion;

class PracticeGame {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.progress = 0;
        this.isStarted = false;
        
        this.init();
    }

    init() {
        // Initialize UI elements
        this.scoreElement = document.getElementById('score');
        this.streakElement = document.getElementById('streak');
        this.progressElement = document.getElementById('progress');
        this.practiceCard = document.getElementById('practice-card');
        this.startButton = document.getElementById('start-practice');
        this.hintButton = document.getElementById('hint-btn');

        // Add event listeners
        this.startButton.addEventListener('click', () => this.startPractice());
        this.hintButton.addEventListener('click', () => this.showHint());

        // Initialize Framer Motion animations
        this.initializeAnimations();
    }

    initializeAnimations() {
        // Animate practice card on mount
        motion.animate(this.practiceCard, {
            scale: [0.9, 1],
            opacity: [0, 1]
        }, {
            duration: 0.5,
            ease: "easeOut"
        });

        // Add hover animation to practice card
        this.practiceCard.addEventListener('mouseenter', () => {
            motion.animate(this.practiceCard, {
                scale: 1.02
            }, {
                duration: 0.2,
                ease: "easeOut"
            });
        });

        this.practiceCard.addEventListener('mouseleave', () => {
            motion.animate(this.practiceCard, {
                scale: 1
            }, {
                duration: 0.2,
                ease: "easeOut"
            });
        });
    }

    startPractice() {
        if (this.isStarted) return;
        
        this.isStarted = true;
        this.score = 0;
        this.streak = 0;
        this.progress = 0;
        
        // Update UI
        this.updateScore();
        this.updateStreak();
        this.updateProgress();
        
        // Enable hint button
        this.hintButton.disabled = false;
        
        // Animate start transition
        motion.animate(this.practiceCard, {
            scale: [1, 0.9, 1],
            rotate: [0, -5, 0]
        }, {
            duration: 0.5,
            ease: "easeOut"
        });

        // Update card content
        const cardContent = this.practiceCard.querySelector('.card-content');
        cardContent.innerHTML = `
            <h2>Question 1</h2>
            <p>What is the capital of France?</p>
        `;

        // Change button text
        this.startButton.textContent = 'Submit Answer';
    }

    showHint() {
        // Animate hint reveal
        const hintText = document.createElement('div');
        hintText.className = 'hint-text';
        hintText.textContent = 'Think about the city of lights...';
        
        this.practiceCard.appendChild(hintText);
        
        motion.animate(hintText, {
            opacity: [0, 1],
            y: [20, 0]
        }, {
            duration: 0.3,
            ease: "easeOut"
        });

        // Disable hint button after use
        this.hintButton.disabled = true;
    }

    updateScore(points = 0) {
        this.score += points;
        this.scoreElement.textContent = this.score;
        
        if (points > 0) {
            motion.animate(this.scoreElement, {
                scale: [1, 1.2, 1],
                color: ['#ffffff', '#4CAF50', '#ffffff']
            }, {
                duration: 0.5,
                ease: "easeOut"
            });
        }
    }

    updateStreak(increment = false) {
        if (increment) {
            this.streak++;
            motion.animate(this.streakElement, {
                scale: [1, 1.2, 1],
                color: ['#ffffff', '#ff9800', '#ffffff']
            }, {
                duration: 0.5,
                ease: "easeOut"
            });
        } else {
            this.streak = 0;
        }
        this.streakElement.textContent = this.streak;
    }

    updateProgress(value = 0) {
        this.progress = Math.min(100, this.progress + value);
        this.progressElement.style.width = `${this.progress}%`;
        
        motion.animate(this.progressElement, {
            width: `${this.progress}%`
        }, {
            duration: 0.5,
            ease: "easeOut"
        });
    }

    unlockAchievement(index) {
        const achievement = document.querySelectorAll('.achievement-item')[index];
        achievement.classList.add('unlocked');
        
        motion.animate(achievement, {
            scale: [1, 1.2, 1],
            opacity: [0.5, 1]
        }, {
            duration: 0.5,
            ease: "easeOut"
        });
    }
}

// Initialize the practice game
const game = new PracticeGame();
