import React, { useEffect, useRef, useState } from 'react';


/**
 * ChristmasOverlay - A festive overlay that only shows on December 25-26 (NL timezone)
 * Features: falling snow, occasional Santa sleigh, Christmas tree, and twinkling lights
 * Does not interfere with gameplay (pointer-events: none)
 */
const ChristmasOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isChristmas, setIsChristmas] = useState(false);


    // Check if it's Christmas (Dec 25 or 26) in Netherlands timezone
    useEffect(() => {
        const checkChristmasDate = () => {
            const now = new Date();
            // Get date in Netherlands timezone
            const nlDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
            const month = nlDate.getMonth(); // 0-indexed, so December = 11
            const day = nlDate.getDate();


            // Check if Dec 25 or Dec 26
            const isXmas = month === 11 && (day === 25 || day === 26);
            setIsChristmas(isXmas);
        };


        checkChristmasDate();
        // Check every hour in case date changes while app is open
        const interval = setInterval(checkChristmasDate, 3600000);
        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        if (!isChristmas) return;


        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;


        let width = window.innerWidth;
        let height = window.innerHeight;


        // === SNOW PARTICLES ===
        interface Snowflake {
            x: number;
            y: number;
            size: number;
            speed: number;
            wind: number;
            opacity: number;
        }


        const snowflakes: Snowflake[] = [];
        const maxSnowflakes = Math.min(200, Math.floor(width / 8));


        const createSnowflake = (): Snowflake => ({
            x: Math.random() * width,
            y: Math.random() * height - height,
            size: Math.random() * 4 + 1,
            speed: Math.random() * 2 + 1,
            wind: Math.random() * 0.5 - 0.25,
            opacity: Math.random() * 0.6 + 0.4
        });


        for (let i = 0; i < maxSnowflakes; i++) {
            const flake = createSnowflake();
            flake.y = Math.random() * height; // Start distributed
            snowflakes.push(flake);
        }


        // === SANTA SLEIGH ===
        interface SantaState {
            isActive: boolean;
            x: number;
            y: number;
            nextAppearance: number;
        }


        const santa: SantaState = {
            isActive: false,
            x: -200, // Start from left side
            y: 100,
            nextAppearance: Date.now() + Math.random() * 30000 + 10000 // 10-40 sec first appearance
        };


        // === CHRISTMAS LIGHTS ===
        interface Light {
            x: number;
            y: number;
            color: string;
            phase: number;
        }


        const lights: Light[] = [];
        const lightColors = ['#ff0000', '#00ff00', '#ffff00', '#0088ff', '#ff00ff', '#ff8800'];


        // Top edge lights
        for (let x = 20; x < width - 20; x += 40) {
            lights.push({
                x,
                y: 15,
                color: lightColors[Math.floor(Math.random() * lightColors.length)],
                phase: Math.random() * Math.PI * 2
            });
        }


        // === CHRISTMAS TREE ===
        const treeX = 50;
        const treeY = height - 30;


        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };


        window.addEventListener('resize', resize);
        resize();


        let animationId: number;
        let lastTime = Date.now();


        const drawSnowflake = (flake: Snowflake) => {
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
            ctx.fill();
        };


        const drawChristmasTree = () => {
            const x = treeX;
            const y = treeY;


            // Tree trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - 8, y - 25, 16, 25);


            // Tree layers (3 triangles)
            ctx.fillStyle = '#228B22';


            // Bottom layer
            ctx.beginPath();
            ctx.moveTo(x - 40, y - 25);
            ctx.lineTo(x + 40, y - 25);
            ctx.lineTo(x, y - 80);
            ctx.fill();


            // Middle layer
            ctx.beginPath();
            ctx.moveTo(x - 32, y - 60);
            ctx.lineTo(x + 32, y - 60);
            ctx.lineTo(x, y - 110);
            ctx.fill();


            // Top layer
            ctx.beginPath();
            ctx.moveTo(x - 24, y - 90);
            ctx.lineTo(x + 24, y - 90);
            ctx.lineTo(x, y - 135);
            ctx.fill();


            // Star on top
            const starY = y - 140;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const r = i % 2 === 0 ? 12 : 5;
                const px = x + Math.cos(angle) * r;
                const py = starY + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();


            // Tree ornaments
            const ornaments = [
                { ox: x - 20, oy: y - 45, color: '#ff0000' },
                { ox: x + 15, oy: y - 50, color: '#0088ff' },
                { ox: x - 10, oy: y - 70, color: '#ffff00' },
                { ox: x + 8, oy: y - 80, color: '#ff00ff' },
                { ox: x - 5, oy: y - 100, color: '#00ff00' },
                { ox: x + 12, oy: y - 95, color: '#ff8800' },
            ];


            ornaments.forEach(({ ox, oy, color }) => {
                ctx.beginPath();
                ctx.arc(ox, oy, 5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        };


        const drawLights = (time: number) => {
            lights.forEach((light) => {
                const brightness = 0.5 + 0.5 * Math.sin(time * 0.003 + light.phase);
                ctx.beginPath();
                ctx.arc(light.x, light.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = light.color;
                ctx.globalAlpha = 0.3 + brightness * 0.7;
                ctx.shadowColor = light.color;
                ctx.shadowBlur = 10 + brightness * 10;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            });


            // Draw wire between lights
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 15);
            lights.forEach((light, i) => {
                const sag = Math.sin((i / lights.length) * Math.PI) * 8;
                ctx.lineTo(light.x, light.y + sag);
            });
            ctx.lineTo(width, 15);
            ctx.stroke();
        };


        const drawSanta = () => {
            if (!santa.isActive) return;


            const x = santa.x;
            const y = santa.y + Math.sin(x * 0.02) * 20;


            ctx.save();


            // Sleigh
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.ellipse(x, y + 15, 40, 12, 0, 0, Math.PI * 2);
            ctx.fill();


            // Sleigh runner
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 45, y + 25);
            ctx.quadraticCurveTo(x - 50, y + 30, x - 40, y + 30);
            ctx.lineTo(x + 30, y + 30);
            ctx.quadraticCurveTo(x + 45, y + 30, x + 50, y + 20);
            ctx.stroke();


            // Santa body
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.ellipse(x, y, 18, 22, 0, 0, Math.PI * 2);
            ctx.fill();


            // Santa head
            ctx.fillStyle = '#fde4cf';
            ctx.beginPath();
            ctx.arc(x, y - 25, 12, 0, Math.PI * 2);
            ctx.fill();


            // Santa hat
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 30);
            ctx.lineTo(x + 12, y - 30);
            ctx.lineTo(x + 20, y - 50);
            ctx.fill();


            // Hat pompom
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + 22, y - 52, 5, 0, Math.PI * 2);
            ctx.fill();


            // Hat trim
            ctx.fillRect(x - 14, y - 32, 28, 6);


            // Beard
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(x, y - 15, 10, 12, 0, 0, Math.PI);
            ctx.fill();


            // Reindeer (simplified) - positioned in FRONT of sleigh (to the right, moving left-to-right)
            const reindeerX = x + 80;
            const reindeerY = y + 5 + Math.sin(x * 0.02 + 1) * 5;


            // Reindeer body
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(reindeerX, reindeerY, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();


            // Reindeer head (facing right - direction of movement)
            ctx.beginPath();
            ctx.ellipse(reindeerX + 30, reindeerY - 8, 12, 10, 0.3, 0, Math.PI * 2);
            ctx.fill();


            // Antlers (facing right)
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(reindeerX + 35, reindeerY - 15);
            ctx.lineTo(reindeerX + 40, reindeerY - 30);
            ctx.lineTo(reindeerX + 35, reindeerY - 25);
            ctx.moveTo(reindeerX + 40, reindeerY - 30);
            ctx.lineTo(reindeerX + 45, reindeerY - 25);
            ctx.stroke();


            ctx.beginPath();
            ctx.moveTo(reindeerX + 28, reindeerY - 15);
            ctx.lineTo(reindeerX + 25, reindeerY - 30);
            ctx.lineTo(reindeerX + 28, reindeerY - 25);
            ctx.moveTo(reindeerX + 25, reindeerY - 30);
            ctx.lineTo(reindeerX + 20, reindeerY - 25);
            ctx.stroke();


            // Rudolph's red nose (on the right, facing right)
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(reindeerX + 42, reindeerY - 6, 4, 0, Math.PI * 2);
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;


            // Reins (connecting sleigh to reindeer in front)
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 40, y + 5);
            ctx.lineTo(reindeerX - 20, reindeerY);
            ctx.stroke();


            ctx.restore();
        };


        const update = () => {
            const now = Date.now();
            const delta = (now - lastTime) / 16.67; // Normalize to ~60fps
            lastTime = now;


            ctx.clearRect(0, 0, width, height);


            // Update & draw snowflakes
            for (let i = 0; i < snowflakes.length; i++) {
                const flake = snowflakes[i];
                flake.y += flake.speed * delta;
                flake.x += flake.wind * delta + Math.sin(now * 0.001 + i) * 0.3;


                if (flake.y > height + 10) {
                    flake.y = -10;
                    flake.x = Math.random() * width;
                }
                if (flake.x > width + 10) flake.x = -10;
                if (flake.x < -10) flake.x = width + 10;


                drawSnowflake(flake);
            }


            // Draw Christmas tree
            drawChristmasTree();


            // Draw lights
            drawLights(now);


            // Santa logic - moves LEFT to RIGHT at half speed
            if (!santa.isActive && now > santa.nextAppearance) {
                santa.isActive = true;
                santa.x = -200; // Start from left side
                santa.y = 80 + Math.random() * 100;
            }


            if (santa.isActive) {
                santa.x += 1.5 * delta; // Move RIGHT, half speed
                drawSanta();


                if (santa.x > width + 200) { // Exit on right side
                    santa.isActive = false;
                    santa.nextAppearance = now + 30000 + Math.random() * 30000; // 30-60 sec
                }
            }


            animationId = requestAnimationFrame(update);
        };


        update();


        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [isChristmas]);


    // Don't render anything if it's not Christmas
    if (!isChristmas) return null;


    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[95]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};


export default ChristmasOverlay;
