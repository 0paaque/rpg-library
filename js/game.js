/* =========================
ELEMENTS
========================= */
const player = document.getElementById('player')
const world = document.getElementById('world')
const promptBox = document.getElementById('prompt')
const dialogueBox = document.getElementById('dialogueBox')
const inventoryBox = document.getElementById('inventoryBox')
const loadingScreen = document.getElementById('loadingScreen')
const loadingProgress = document.getElementById('loadingProgress')
const WORLD_CENTER = window.innerWidth / 2
const closeDialogue =
    document.getElementById("closeDialogue")


const spawnX = WORLD_CENTER - 100
const DAY1_REQUIRED_CLUES = 4
let footstepTimer = 0

const dayEndScreen = document.getElementById("dayEndScreen")
const dayEndText = document.getElementById("dayEndText")

function showDayEndScreen(text, callback) {

    dayEndText.innerText = text
    dayEndScreen.classList.add("show")

    // pause movement/game input
    state.paused = true

    setTimeout(() => {

        dayEndScreen.classList.remove("show")
        state.paused = false

        if (callback) callback()

    }, 2500) // 👈 controls how long it stays
}
const footstepSounds = [

    new Audio("audio/footstep2.mp3"),
]
/* =========================
STATE
========================= */
const GROUND_OFFSET = 30
const state = {
    day1Complete: false,
    worldX: 0,
    y: 580,
    speed: 5,
    keys: {},
    day: 1,
    clues: [],
    storyStage: 0n,

    frame: 0,
    frameTick: 0,
    frameSpeed: 6,

    moving: false,
    facing: "right",
    currentRoom: null,
    previousRoom: null,
}



/* =========================
INVENTORY (CLUES)
========================= */

function addClue(text) {

    if (!state.clues.includes(text)) {

        state.clues.push(text)



        updateInventory()

        showDialogue("Clue added: " + text, 1200)

        checkStoryProgress()

        checkDay1Complete()
        if (state.day === 1 &&
            state.clues.length >= DAY1_REQUIRED_CLUES) {

            completeDay1()
        }
    }
}


function updateInventory() {
    inventoryBox.innerHTML =
        `<b>Day ${state.day}</b><br>` +
        (state.day1Complete ? "✓ Ready to end shift<br><br>" : "") +
        state.clues.map(c => "• " + c).join("<br>")
}
closeDialogue.addEventListener("click", () => {

    dialogueQueue.length = 0

    dialogueBox.style.display = "none"

    showingDialogue = false
})
const dialogueSound =
    new Audio("audio/dialogue.wav")

/* =========================
DIALOGUE SYSTEM
========================= */
const dialogueQueue = []
let showingDialogue = false

function showDialogue(text, time = 2000) {
    dialogueSound.currentTime = 0
    dialogueSound.play()
    dialogueQueue.push({ text, time })
    nextDialogue()
}

function nextDialogue() {
    if (showingDialogue) return
    if (dialogueQueue.length === 0) return

    showingDialogue = true
    const { text, time } = dialogueQueue.shift()
    document.getElementById(
        "dialogueContent"
    ).innerText = text
    dialogueBox.style.display = "block"

    setTimeout(() => {
        dialogueBox.style.display = "none"
        showingDialogue = false
        nextDialogue()
    }, time)
}



/* =========================
CORRUPTION SYSTEM
========================= */
let corruption = 0

function addCorruption(val = 1) {
    corruption += val

    if (corruption > 5) {
        document.body.style.filter = "contrast(1.1)"
    }

    if (corruption > 10) {
        showDialogue("Something is rewriting the library...")
    }
}

/* =========================
ROOMS
========================= */
const rooms = [
    {
        id: "books",
        x: 580,
        y: 390,
        w: 300,
        h: 200,

        onEnter: () => {
            if (state.day === 1) {
                showDialogue("Books are neatly arranged.")
            }

            if (state.day === 2) {
                showDialogue("Some books are out of order...")
            }

            if (state.day >= 3) {
                showDialogue("The shelves feel... rewritten.")
            }
        },

        onInteract: () => {
            openInvestigationMenu("books")
        }

    },

    {
        id: "borrow",
        x: 1400,
        y: 390,
        w: 300,
        h: 200,

        onEnter: () => {
            showDialogue("Borrow desk is active.")
        },

        onInteract: () => {
            openInvestigationMenu("borrow")
        }
    },

    {
        id: "security",
        x: 2200,
        y: 390,
        w: 300,
        h: 200,

        onEnter: () => {
            if (state.day === 1) {
                showDialogue("Security logs are stable.")
            }

            if (state.day === 2) {
                showDialogue("Logs show minor inconsistencies...")
            }
        },

        onInteract: () => {
            openInvestigationMenu("security")
        }
    },

    {
        id: "catalog",
        x: 3000,
        y: 390,
        w: 300,
        h: 200,

        onEnter: () => {
            showDialogue("Digital Catalog Terminal is online.")
        },

        onInteract: () => {
            openInvestigationMenu("catalog")
        }
    },

    {
        id: "staff",
        x: 4000,
        y: 390,
        w: 300,
        h: 200,

        onEnter: () => {
            showDialogue("Staff lounge is unusually quiet.")
        },

        onInteract: () => {
            openInvestigationMenu("staff")
        }
    },

    {
        id: "archive",
        x: 800,
        y: 900,
        w: 300,
        h: 200,

        onEnter: () => {
            showDialogue("Restricted Archive: access limited.")
        },

        onInteract: () => {
            openInvestigationMenu("archive")
        }
    }
]

function renderRooms() {
    for (const room of rooms) {
        const el = document.querySelector(`.${room.id}-room`)

        if (!el) continue

        el.style.left = room.x + "px"
        el.style.top = (room.y + GROUND_OFFSET) + "px"
        el.classList.toggle("active", state.currentRoom?.id === room.id)
    }
}

/* =========================
INPUT
========================= */
window.addEventListener("keydown", (e) => {

    state.keys[e.key.toLowerCase()] = true

    if (e.key.toLowerCase() === "e" && state.currentRoom) {

        const room = roomSounds[state.currentRoom.id]

        if (room) {

            room.audio.currentTime = 0
            room.audio.volume = room.volume
            room.audio.play()
        }

        state.currentRoom.onInteract?.()
    }
})

window.addEventListener("keyup", (e) => {
    state.keys[e.key.toLowerCase()] = false
})

/* =========================
MOVEMENT (SPRITE CONTROL)
========================= */
function move() {

    state.moving = false

    const speed = state.speed

    if (state.keys["a"]) {
        state.worldX += speed
        state.facing = "left"
        state.moving = true
    }

    if (state.keys["d"]) {
        state.worldX -= speed
        state.facing = "right"
        state.moving = true
    }

    // Footsteps
    if (state.moving) {

        footstepTimer++

        if (footstepTimer >= 25) {

            footstepTimer = 0

            const sound =
                footstepSounds[
                Math.floor(Math.random() * footstepSounds.length)
                ]

            sound.currentTime = 0
            sound.volume = 0.25

            sound.playbackRate =
                0.95 + Math.random() * 0.1

            sound.play()
        }

    } else {

        footstepTimer = 0
    }

    const maxLeft = 0
    const maxRight = -(world.offsetWidth - window.innerWidth)

    if (state.worldX > maxLeft) state.worldX = maxLeft
    if (state.worldX < maxRight) state.worldX = maxRight
}
const roomSounds = {

    books: {
        audio: new Audio("audio/mixkit-arabian-mystery-harp-notification-2489.wav"),
        volume: 0.1
    },

    borrow: {
        audio: new Audio("audio/mixkit-guitar-stroke-up-2328.wav"),
        volume: 0.3
    },

    security: {
        audio: new Audio("audio/mixkit-nylon-guitar-single-note-2332.wav"),
        volume: 0.5
    },

    catalog: {
        audio: new Audio("audio/mixkit-bell-sound-with-delay-585.wav"),
        volume: 0.5
    },

    staff: {
        audio: new Audio("audio/mixkit-horror-deep-drum-heartbeat-559.wav"),
        volume: 0.5
    },

    archive: {
        audio: new Audio("audio/archive.mp3"),
        volume: 0.2
    }
}
/* =========================
ANIMATION
========================= */
function updateAnimation() {
    if (!state.moving) {
        state.frame = 0
        return
    }

    state.frameTick++

    if (state.frameTick >= state.frameSpeed) {
        state.frameTick = 0
        state.frame = (state.frame + 1) % 6
    }
}
function updateCamera() {
    world.style.transform = `translateX(${state.worldX}px)`
}

/* =========================
ROOM DETECTION (DISTANCE BASED)
========================= */
function checkRooms() {
    state.currentRoom = null

    const playerWorldX = window.innerWidth / 2 - state.worldX

    for (const room of rooms) {

        const dx = Math.abs((room.x + room.w / 2) - playerWorldX)

        // 🔥 ONLY USE X DISTANCE (since Y is fake-fixed)
        if (dx < 120) {
            state.currentRoom = room
            break
        }
    }



    promptBox.style.display = state.currentRoom ? "block" : "none"

    if (state.currentRoom && state.currentRoom !== state.previousRoom) {
        state.currentRoom.onEnter?.()
    }

    state.previousRoom = state.currentRoom
}
/* =========================
RENDER (SPRITES + FLIP)
========================= */
function render() {
    const frameWidth = 64
    const offsetX = state.frame * frameWidth

    // Player stays centered ALWAYS
    player.style.left = "50%"
    player.style.bottom = (80 - GROUND_OFFSET) + "px"
    player.style.transform = "translateX(-50%) scaleX(" +
        (state.facing === "left" ? -1 : 1) +
        ")"

    player.style.width = "64px"
    player.style.height = "64px"

    player.style.backgroundImage = "url(sprites/walk.png)"
    player.style.backgroundSize = "384px 64px"
    player.style.backgroundPosition = `-${offsetX}px 0px`
}

/* =========================
GAME LOOP
========================= */
function loop() {
    if (state.paused) return
    move()
    updateAnimation()
    updateCamera()
    render()
    renderRooms()
    checkRooms()

    requestAnimationFrame(loop)
}
loop()

/* =========================
LOADING SCREEN
========================= */
let progress = 0

const load = setInterval(() => {
    progress += 5
    loadingProgress.style.width = progress + "%"

    if (progress >= 100) {
        clearInterval(load)
        loadingScreen.style.display = "none"

        showDialogue("Day 1: Your shift as librarian begins...")
    }
}, 50)


function nextDay() {
    state.day++

    if (state.day === 2) {
        showDialogue("Day 2: Some records are missing...")
        rooms.find(r => r.id === "security").onEnter = () => {
            showDialogue("Security logs are partially corrupted.")
        }
    }

    if (state.day === 3) {
        showDialogue("Day 3: The Archive Codex is gone from all records.")
        addCorruption(3)
    }
}

function openInvestigationMenu(roomId) {

    let options = []

    if (roomId === "books") {
        options = [
            {
                text: "Inspect missing shelf",
                action: () => {
                    addClue("Missing Book Slot Found")
                    addCorruption(1)
                    showDialogue("Something was removed recently.")
                }
            },
            {
                text: "Check catalog",
                action: () => {
                    showDialogue("Catalog looks normal... too normal.")
                }
            }
        ]
    }

    if (roomId === "security") {
        options = [
            {
                text: "Review logs",
                action: () => {
                    addClue("Edited Security Log")
                    addCorruption(2)
                    showDialogue("Logs have been tampered with.")
                }
            },
            {
                text: "Check cameras",
                action: () => {
                    showDialogue("Footage is missing between timestamps.")
                }
            }
        ]
    }

    if (roomId === "borrow") {
        options = [
            {
                text: "Check borrow records",
                action: () => {
                    showDialogue("No anomalies detected.")
                }
            }
        ]
    }

    if (roomId === "catalog") {

        options = [
            {
                text: "Search Archive Codex",
                action: () => {
                    showDialogue("No results found.")
                    addClue("Catalog Denial: Archive Codex")
                }
            },
            {
                text: "Check recent deletions",
                action: () => {
                    showDialogue("1 record removed today.")
                    addClue("Recent Deletion Log")
                }
            }
        ]
    }

    if (roomId === "staff") {

        options = [
            {
                text: "Check employee board",
                action: () => {
                    showDialogue("Your name is missing.")
                    addClue("Missing Employee Entry")
                }
            },
            {
                text: "Look at ID scanner",
                action: () => {
                    showDialogue("ACCESS ERROR: identity not found")
                    addCorruption(1)
                }
            }
        ]
    }

    if (roomId === "archive") {
        options = [
            {
                text: "Request access",
                action: () => {
                    showDialogue("Access denied.")
                    addCorruption(1)
                }
            }
        ]
    }

    showChoiceUI(options)
}

function showChoiceUI(options) {

    let text = "What will you do?\n\n"

    options.forEach((opt, index) => {
        text += `${index + 1}. ${opt.text}\n`
    })

    showDialogue(text, 4000)

    function handler(e) {
        const num = parseInt(e.key)

        if (num >= 1 && num <= options.length) {
            options[num - 1].action()
            window.removeEventListener("keydown", handler)
        }
    }

    window.addEventListener("keydown", handler)
}
function updateAtmosphere() {
    if (corruption > 3) {
        document.body.style.filter = "contrast(1.1) brightness(0.95)"
    }

    if (corruption > 6) {
        document.body.style.filter = "contrast(1.3) brightness(0.8) hue-rotate(10deg)"
    }
}

function endDay() {

    state.day++

    state.clues = []
    state.day1Complete = false

    updateInventory()

    showDialogue("Day " + state.day + " begins...")
}
window.addEventListener("keydown", (e) => {

    if (e.key.toLowerCase() === "enter") {

        // DAY 1 END
        if (state.day === 1 && state.day1Complete) {
            endDay()
            return
        }

        // DAY 2 END (optional condition later)
        if (state.day === 2) {
            endDay()
            return
        }

        if (state.day === 3) {
            endDay()
            return
        }
    }
})
function chapter1Ending() {
    showDialogue(
        "All records have been rewritten.\n\n" +
        "But one thing remains inconsistent...\n\n" +
        "You were not hired yesterday.",
        6000
    )
}

function checkDay1Complete() {

    const requiredClues = 4

    if (state.day === 1 &&
        state.clues.length >= requiredClues) {

        showDialogue(
            "You’ve gathered enough information.\n\nPress ENTER to end your shift."
        )

        state.day1Ready = true
    }
}

function completeDay1() {

    state.day1Complete = true

    showDayEndScreen("DAY 1 COMPLETE", () => {

        showDialogue("Proceeding to Day 2...")

        endDay()
    })
}
function checkStoryProgress() {

    const c = state.clues.length

    // DAY 1 COMPLETE
    if (state.day === 1 && c >= 3) {

        showDialogue(
            "You've gathered enough information.\n\nPress ENTER to end your shift."
        )

        state.storyStage = 1
    }

    // DAY 2 TRIGGER
    if (state.day === 2 && c >= 6) {

        showDialogue(
            "The library feels... different today."
        )

        state.storyStage = 2
    }

    // DAY 3 TRIGGER
    if (state.day === 3 && c >= 9) {

        showDialogue(
            "Something is watching you from the archive."
        )

        state.storyStage = 3
    }
}