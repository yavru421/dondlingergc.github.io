
        const Engine = Matter.Engine,
              Render = Matter.Render,
              Runner = Matter.Runner,
              Bodies = Matter.Bodies,
              Composite = Matter.Composite,
              Mouse = Matter.Mouse,
              MouseConstraint = Matter.MouseConstraint;

        const engine = Engine.create();
        const world = engine.world;
        engine.gravity.y = 0.15; // Lunar Gravity

        const render = Render.create({
            element: document.body,
            engine: engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent'
            }
        });
        render.canvas.style.position = 'absolute';
        render.canvas.style.top = '0';
        render.canvas.style.left = '0';
        render.canvas.style.zIndex = '5';
        
        const wallOptions = { isStatic: true, render: { visible: false } };
        const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 250, window.innerWidth * 2, 500, wallOptions);
        const leftWall = Bodies.rectangle(-250, window.innerHeight / 2, 500, window.innerHeight * 2, wallOptions);
        const rightWall = Bodies.rectangle(window.innerWidth + 250, window.innerHeight / 2, 500, window.innerHeight * 2, wallOptions);
        const ceiling = Bodies.rectangle(window.innerWidth / 2, -250, window.innerWidth * 2, 500, wallOptions);

        Composite.add(world, [ground, leftWall, rightWall, ceiling]);

        const bodiesMap = [];
        const size = 140; 
        const radius = 24; 

        // Creature
        const creatureElem = document.getElementById('creature');
        const creatureSize = 100;
        const creatureBody = Bodies.circle(window.innerWidth / 2, window.innerHeight / 2, creatureSize/2, {
            restitution: 0.9, 
            friction: 0.1,
            frictionAir: 0, 
            density: 1.5, 
            render: { visible: false }
        });
        Composite.add(world, creatureBody);

        setInterval(() => {
            if (creatureBody.position.y > window.innerHeight + 200 || creatureBody.position.y < -200 || creatureBody.position.x < -200 || creatureBody.position.x > window.innerWidth + 200) {
                Matter.Body.setPosition(creatureBody, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
                Matter.Body.setVelocity(creatureBody, { x: 0, y: 0 });
            }

            const speed = 25 + Math.random() * 15; 
            const angle = Math.random() * Math.PI * 2;
            Matter.Body.setVelocity(creatureBody, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
            
            creatureElem.style.transform += ` scale(1.4)`;
            setTimeout(() => {
                creatureElem.style.transform = creatureElem.style.transform.replace(' scale(1.4)', '');
            }, 200);
        }, 3000);

        // Apps
        const domElements = document.querySelectorAll('.phys-app');
        domElements.forEach((el, index) => {
            const startX = (window.innerWidth / 2) + ((Math.random() - 0.5) * 600);
            const startY = 100 + Math.random() * 300; 

            const body = Bodies.rectangle(startX, startY, size, size, {
                chamfer: { radius: radius },
                restitution: 0.85,
                friction: 0.1,
                frictionAir: 0.01,
                density: 0.05,
                render: { visible: false } 
            });

            Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
            Composite.add(world, body);
            bodiesMap.push({ body: body, elem: el });

            function openApp() {
                if (el.classList.contains('expanded')) return;
                
                document.querySelectorAll('.phys-app.expanded').forEach(otherEl => {
                    otherEl.querySelector('.btn-close').click();
                });

                el.classList.add('expanded');
                
                Matter.Body.setStatic(body, true);
                Matter.Body.setPosition(body, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
                Matter.Body.setAngle(body, 0);

                const expandedWidth = Math.min(window.innerWidth * 0.9, 600);
                const expandedHeight = Math.min(window.innerHeight * 0.7, 500);
                
                const scaleX = expandedWidth / size;
                const scaleY = expandedHeight / size;
                Matter.Body.scale(body, scaleX, scaleY);
                
                el.dataset.scaleX = scaleX;
                el.dataset.scaleY = scaleY;
            }

            const closeBtn = el.querySelector('.btn-close');
            closeBtn.addEventListener('mousedown', e => e.stopPropagation());
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                el.classList.remove('expanded');
                
                const scaleX = parseFloat(el.dataset.scaleX);
                const scaleY = parseFloat(el.dataset.scaleY);
                
                Matter.Body.scale(body, 1/scaleX, 1/scaleY);
                Matter.Body.setStatic(body, false);
            });

            let startPos = { x: 0, y: 0 };
            el.addEventListener('mousedown', (e) => {
                if (e.target.closest('.btn-close') || e.target.closest('.btn-launch')) return;
                startPos = { x: e.clientX, y: e.clientY };
            });

            el.addEventListener('mouseup', (e) => {
                if (e.target.closest('.btn-close') || e.target.closest('.btn-launch')) return;
                const dist = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);
                if (dist < 5) { 
                    openApp();
                }
            });
            
            el.addEventListener('touchstart', (e) => {
                if (e.target.closest('.btn-close') || e.target.closest('.btn-launch')) return;
                startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }, {passive: true});
            
            el.addEventListener('touchend', (e) => {
                if (e.target.closest('.btn-close') || e.target.closest('.btn-launch')) return;
                const touch = e.changedTouches[0];
                const dist = Math.hypot(touch.clientX - startPos.x, touch.clientY - startPos.y);
                if (dist < 5) {
                    openApp();
                }
            });
        });

        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(world, mouseConstraint);
        render.mouse = mouse; 

        Matter.Events.on(engine, 'afterUpdate', function() {
            bodiesMap.forEach(map => {
                const pos = map.body.position;
                const angle = map.body.angle;
                map.elem.style.transform = `translate(${pos.x - size/2}px, ${pos.y - size/2}px) rotate(${angle}rad)`;
            });

            const cPos = creatureBody.position;
            const cAngle = creatureBody.angle;
            creatureElem.style.transform = `translate(${cPos.x - creatureSize/2}px, ${cPos.y - creatureSize/2}px) rotate(${cAngle}rad)`;
        });

        window.addEventListener('resize', () => {
            render.canvas.width = window.innerWidth;
            render.canvas.height = window.innerHeight;
            Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 250 });
            Matter.Body.setPosition(rightWall, { x: window.innerWidth + 250, y: window.innerHeight / 2 });
            Matter.Body.setPosition(leftWall, { x: -250, y: window.innerHeight / 2 });
            Matter.Body.setPosition(ceiling, { x: window.innerWidth / 2, y: -250 });
            
            const expandedApp = document.querySelector('.phys-app.expanded');
            if (expandedApp) {
                const map = bodiesMap.find(m => m.elem === expandedApp);
                if (map) {
                    const body = map.body;
                    Matter.Body.setPosition(body, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
                    
                    const scaleX = parseFloat(expandedApp.dataset.scaleX);
                    const scaleY = parseFloat(expandedApp.dataset.scaleY);
                    Matter.Body.scale(body, 1/scaleX, 1/scaleY); 
                    
                    const newW = Math.min(window.innerWidth * 0.9, 600);
                    const newH = Math.min(window.innerHeight * 0.7, 500);
                    const newScaleX = newW / size;
                    const newScaleY = newH / size;
                    
                    Matter.Body.scale(body, newScaleX, newScaleY);
                    expandedApp.dataset.scaleX = newScaleX;
                    expandedApp.dataset.scaleY = newScaleY;
                }
            }
        });

        /* =========================================
           CHAOS OVERLAY LOGIC 
           ========================================= */
        const overlay = document.getElementById('chaos-overlay');
        const closeChaosBtn = document.getElementById('close-chaos');
        const logsContainer = document.getElementById('terminal-logs');

        const logs = [
            "INITIALIZING CHAOS PROTOCOL...",
            "BYPASSING MATTER.JS PHYSICS ENGINE... [SUCCESS]",
            "GRAVITY: DISABLED.",
            "FRICTION: NEUTRALIZED.",
            "ENTITY #404 (ALIEN) AWAKENED.",
            "WARNING: REALITY CONTAINMENT BREACH DETECTED.",
            "DOWNLOADING BIO-SIGNATURE...",
            "DATA CORRUPT. GLITCH CASCADE IMMINENT.",
            "SYSTEM COMPROMISED...",
            "> AWAITING USER OVERRIDE."
        ];

        let typeInterval;

        function typeLogs() {
            logsContainer.innerHTML = "";
            let logIndex = 0;
            let charIndex = 0;
            
            typeInterval = setInterval(() => {
                if (logIndex < logs.length) {
                    if (charIndex === 0) {
                        logsContainer.innerHTML += "<div>> </div>";
                    }
                    
                    const currentLog = logs[logIndex];
                    const divs = logsContainer.querySelectorAll('div');
                    const lastDiv = divs[divs.length - 1];
                    
                    lastDiv.innerHTML += currentLog.charAt(charIndex);
                    charIndex++;
                    
                    if (charIndex >= currentLog.length) {
                        logIndex++;
                        charIndex = 0;
                        logsContainer.scrollTop = logsContainer.scrollHeight;
                    }
                } else {
                    clearInterval(typeInterval);
                }
            }, 25);
        }

        creatureElem.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Stop physics drag
            triggerChaosOverlay();
        });

        function triggerChaosOverlay() {
            if (engine.timing) engine.timing.timeScale = 0; // Pause physics
            
            overlay.classList.remove('hidden');
            setTimeout(() => { overlay.classList.add('active'); }, 10);
            
            typeLogs();
        }

        closeChaosBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            
            setTimeout(() => {
                overlay.classList.add('hidden');
                clearInterval(typeInterval);
                if (engine.timing) engine.timing.timeScale = 1; // Resume physics
            }, 500);
        });

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);
    
