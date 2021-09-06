//Mettre le code hexadecimal de la couleur du background ici
const backgroundColor = 0x000000

//L'opacité du background (entre 0 et 1) : à 0, le background est complètement transparent.
const backgroundOpacity = 0

//#region VARIABLES
let canvas
let scene
let camera
let renderer

const timeTotal = 30
let ballTotal = 0
let ballGroup

let computer = null
let placed = false

//  States
let timeLeft
let currentScore
let gameStarted = false

//  BALL THROWER
let maxZSpeed
let maxXSpeed
let maxYSpeed
let ballFrequency
let launchedChrono

//  BALL AND THROWER
let balls
let ballGeometry
let transparentMat
let redBallMat
let blueBallMat
let greenBallMat
let yellowBallMat
let blackBallMat
let whiteBallMat
let timerTotal
let timerModel
const timerRotationSpeed = 5

//  BOX EFFECTS
let boxEffectsColor
let boxEffectsBlack
const boxEffectDuration = 2

//  CSS
let welcomeDiv
let uspDiv
let tutorialDiv
let gameDiv
let endgameDiv
let spinDiv
let win10Div
let loseDiv
let playUi
let scoreUi
let timeUi
let parentDiv
let finalScore

//  Score Texts
const scoreTexts = []
const scoreTextDuration = 1
const scoreTextSpeedReducer = 50

//  AUDIO
let sound1
let sound2

//  CLOCK
const clock = new THREE.Clock()
let delta = 0

// DIFFICULTY
const secondBlackBallThreshold = 3000
const thirdBlackBallThreshold = 6000

const speedChangePerPoint = 0.005

const modelFile = './assets/Chromebook.glb' // 3D model to spawn at tap
const timerFile = './assets/Timer.glb' // 3D model to spawn at tap
const startScale = new THREE.Vector3(0.01, 0.01, 0.01) // Initial scale value for our model
const endScale = new THREE.Vector3(0.05, 0.05, 0.05) // Ending scale value for our model
const animationMillis = 500 // Animate over 0.75 seconds

const raycaster = new THREE.Raycaster()
const mousePos = new THREE.Vector2()
const loader = new THREE.GLTFLoader() // This comes from GLTFLoader.js.

//#endregion

//#region INIT
const initializeVariables = () => {
  //  States
  currentScore = 0

  //  Ball thrower
  maxZSpeed = 50
  maxXSpeed = 30
  maxYSpeed = 30
  ballFrequency = 300
  balls = {}
}
// Populates some object into an XR scene and sets the initial camera position. The scene and
// camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
const initScene = () => {
  canvas = document.getElementById("threeJsCanvas")
  canvas.addEventListener('mousedown', mouseHandler, true) // Add touch listener.

  renderer = new THREE.WebGLRenderer({domElement:canvas, alpha:true});
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor( 0xffffff, 0);
  canvas.appendChild(renderer.domElement)
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)

  const light = new THREE.DirectionalLight(0xffffff, 1, 100)
  light.position.set(1, 4.3, 2.5) // default

  scene = new THREE.Scene()
  scene.background = null;

  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth/ canvas.clientHeight, 0.1, 1000)
  scene.add(camera)

  scene.add(light) // Add soft white light to the scene.
  scene.add(new THREE.AmbientLight(0x404040, 1)) // Add soft white light to the scene.

  light.shadow.mapSize.width = 1024 // default
  light.shadow.mapSize.height = 1024 // default
  light.shadow.camera.near = 0.5 // default
  light.shadow.camera.far = 500 // default
  light.castShadow = true

  // Set the initial camera position relative to the scene we just laid out. This must be at a
  // height greater than y=0.
  camera.position.set(0, 3, 5)

  sound1 = []
  sound2 = []
  sound1.push(document.getElementById('audio1'))
  sound1.push(document.getElementById('audio1b'))
  sound1.push(document.getElementById('audio1c'))
  sound1.push(document.getElementById('audio1d'))
  sound1.push(document.getElementById('audio1e'))
  sound2.push(document.getElementById('audio2'))
  sound2.push(document.getElementById('audio2b'))
  sound2.push(document.getElementById('audio2c'))
}

//#endregion

//#region AUXILIARIES
const playSound = (soundArray) => {
  for (let index = 0; index < soundArray.length; index++) {
    if (soundArray[index].paused) {
      soundArray[index].play()
      return
    }
  }
  soundArray[0].play()
}

const socialMediaShare = () => {
  if (navigator.share) {
    navigator.share({
      title: `I just scored ${currentScore} points and ` +
        'got an offer of up to 70% on all Chromebooks !',
      text: '',
      url: window.location.href,
    })
  }
}

const toScreenPosition = (p) => {
  const vector = p.clone().project(camera)
  vector.x = ((vector.x + 1) / 2) * window.innerWidth
  vector.y = -((vector.y - 1) / 2) * window.innerHeight
  return vector
}

//#endregion

//#region SCORE TEXT

const updateScoreText = () => {
  if (!scoreTexts || scoreTexts.length === 0) {
    return
  }
  const toRemove = []
  for (let i = 0; i < scoreTexts.length; i++) {
    const textData = scoreTexts[i]
    textData.timeLeft -= delta
    const pos = toScreenPosition(textData.pos)
    textData.text.style.top = `${pos.y}px`
    textData.text.style.left = `${pos.x}px`
    textData.pos.y += delta * (maxZSpeed / scoreTextSpeedReducer)
    textData.text.style.opacity = textData.timeLeft / scoreTextDuration
    if (textData.timeLeft < 0) {
      toRemove.push(i)
    }
  }

  for (let i = 0; i < toRemove.length; i++) {
    const data = scoreTexts[toRemove[i]]
    data.text.remove()
    scoreTexts.splice(toRemove[i], 1)
  }
}

const generateScoreText = (ball) => {
  const p = new THREE.Vector3(0, 0, 0)
  ball.getWorldPosition(p)
  const pos = toScreenPosition(p)
  const text2 = document.createElement('div')
  // text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
  let {
    points
  } = balls[ball.name]
  if (points > 5) {
    points = `+${points}`
  } else if (points > 0) {
    points = '+5 s'
  } else {
    points = points.toString()
  }
  text2.innerHTML = points
  text2.style.top = `${pos.y}px`
  text2.style.left = `${pos.x}px`
  text2.className = 'scoreDynamic'
  document.body.appendChild(text2)

  const newTextData = {
    'text': text2,
    'pos': p,
    'timeLeft': scoreTextDuration,
  }

  scoreTexts.push(newTextData)
}

const updateScore = () => {
  scoreUi.innerText = `${currentScore.toString()} points`
  timeUi.innerText = `${timeLeft.toFixed(0).toString()} sec. `
}

//#endregion

//#region BOX EFFECT
const getRandomColor = () => {
  // Returns a random integer from 1 to 4:
  const random = Math.floor(Math.random() * 4) + 1

  if (random === 1) {
    return redBallMat
  }
  if (random === 2) {
    return blueBallMat
  }
  if (random === 3) {
    return greenBallMat
  } else {
    return yellowBallMat
  }
}

const stopBoxEffect = (boxEffect) => {
  boxEffect.playing = false
  for (let i = 0; i < boxEffect.boxes; i++) {
    computer.remove(boxEffect[i])
  }
}

const updateBoxEffect = (boxEffect) => {
  if (!boxEffect.playing) {
    return
  }
  for (let i = 0; i < boxEffect.boxes.length; i++) {
    const boxData = boxEffect.boxes[i]
    boxData.box.position.x += boxData.speed.x * delta
    boxData.box.position.y += boxData.speed.y * delta
    boxData.box.position.z += boxData.speed.z * delta

    boxData.box.rotation.x += boxData.rotation.x * delta
    boxData.box.rotation.y += boxData.rotation.y * delta
    boxData.box.rotation.z += boxData.rotation.z * delta

    boxData.box.scale.x = boxData.scale * (boxEffect.timeLeft / boxEffectDuration)
    boxData.box.scale.y = boxData.box.scale.x
    boxData.box.scale.z = boxData.box.scale.x
  }

  boxEffect.timeLeft -= delta
  if (boxEffect.timeLeft < 0) {
    stopBoxEffect(boxEffect)
  }
}

const updateBoxEffects = () => {
  for (let i = 0; i < boxEffectsColor.length; i++) {
    updateBoxEffect(boxEffectsColor[i])
  }
  for (let i = 0; i < boxEffectsBlack.length; i++) {
    updateBoxEffect(boxEffectsBlack[i])
  }
}

const pickBox = (black) => {
  if (black) {
    for (let j = 0; j < boxEffectsBlack.length; j++) {
      if (!boxEffectsBlack[j].playing) {
        return boxEffectsBlack[j]
      }
    }
    return boxEffectsBlack[0]
  } else {
    for (let j = 0; j < boxEffectsColor.length; j++) {
      if (!boxEffectsColor[j].playing) {
        return boxEffectsColor[j]
      }
    }
    return boxEffectsColor[0]
  }
}
const startBoxEffect = (ball) => {
  const newBox = pickBox(balls[ball.name].points < 0)

  for (let i = 0; i < newBox.boxes.length; i++) {
    const boxData = newBox.boxes[i]
    boxData.box.position.x = ball.position.x
    boxData.box.position.y = ball.position.y
    boxData.box.position.z = ball.position.z

    boxData.box.scale.x = boxData.scale
    boxData.box.scale.y = boxData.scale
    boxData.box.scale.z = boxData.scale
    computer.add(boxData.box)
  }
  newBox.playing = true
  newBox.timeLeft = boxEffectDuration
}

const generateBoxes = () => {
  const geo = new THREE.BoxGeometry()
  let mat
  boxEffectsColor = []
  boxEffectsBlack = []
  let currentStruct
  for (let j = 0; j < 15; j++) {
    currentStruct = {
      'playing': false,
      'timeLeft': boxEffectDuration,
      'boxes': [],
    }

    for (let i = 0; i < 50; i++) {
      if (j < 10) {
        mat = getRandomColor()
      } else {
        mat = blackBallMat
      }

      const box = new THREE.Mesh(geo, mat)
      const boxRotation = new THREE.Vector3(
        Math.random() * 10, Math.random() * 10, Math.random() * 10
      )
      const boxSpeed = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      boxSpeed.multiplyScalar(30)
      const scale = Math.random() * 4
      const boxData = {
        'box': box,
        'speed': boxSpeed,
        'rotation': boxRotation,
        'scale': scale,
      }

      currentStruct.boxes.push(boxData)
    }
    if (j < 10) {
      boxEffectsColor.push(currentStruct)
    } else {
      boxEffectsBlack.push(currentStruct)
    }
  }
}

//#endregion

//#region BALLS
const ballsSetupHandler = () => {
  // WE ENVELOP THE BALL WITH A BIGGER INVISIBLE ONE TO MAKE THEM EASIER TO TOUCH
  ballGeometry = new THREE.SphereGeometry(0.5, 32, 32)
  transparentMat = new THREE.MeshLambertMaterial({
    color: 0x000000f,
    transparent: true,
    opacity: 0,
  })

  //  DIFFERENT COLOURS FOR THE BALLS
  redBallMat = new THREE.MeshPhongMaterial({
    shininess: 150,
    color: 0xdb4437,
  })
  blueBallMat = new THREE.MeshPhongMaterial({
    shininess: 150,
    color: 0x4285f4,
  })
  greenBallMat = new THREE.MeshPhongMaterial({
    shininess: 150,
    color: 0x0f9d58,
  })
  yellowBallMat = new THREE.MeshPhongMaterial({
    shininess: 150,
    color: 0xf4b400,
  })
  blackBallMat = new THREE.MeshPhongMaterial({
    shininess: 150,
    color: 0x000000,
  })
  whiteBallMat = new THREE.MeshPhongMaterial({
    shininess: 150,
    color: 0xffffff,
    side : THREE.DoubleSide
  })
}

const destroyBallHandler = (ball, scored) => {
  if (scored) {
    if (balls[ball.name].color !== 'timer') {
      currentScore += balls[ball.name].points
    } else {
      timeLeft += 5
    }
    updateScore()
    startBoxEffect(ball)
    generateScoreText(ball)
    if (balls[ball.name].points > 0) {
      playSound(sound1)
    } else {
      playSound(sound2)
    }
  }

  // DISPOSE OF GEOMETRY AND MATERIALS OF BALL AND ITS ENVELOP
  ball.geometry.dispose()
  ball.material.dispose()
  if (balls[ball.name].child.geometry) {
    balls[ball.name].child.geometry.dispose()
    balls[ball.name].child.material.dispose()
  }

  // REMOVE THEM FROM THE SCENE
  ball.remove(balls[ball.name].child)
  ballGroup.remove(ball)
  delete balls[ball.name]
}

const spawnChrono = () => {
  if (!gameStarted) {
    return
  }
  ballTotal += 1
  const currentBall = new THREE.Mesh(ballGeometry, transparentMat)
  currentBall.scale.x = 15
  currentBall.scale.y = 15
  currentBall.scale.z = 15

  let currentBallXSpeed
  let currentBallZSpeed
  const currentBallTimeLeft = 3
  const currentBallName = ballTotal.toString()

  const currentBallChild = timerModel
  const currentBallPoints = 5
  const currentBallColor = 'timer'

  ballGroup.add(currentBall)
  currentBall.add(currentBallChild)
  currentBallChild.scale.x = 0.005
  currentBallChild.scale.y = 0.005
  currentBallChild.scale.z = 0.005

  //  DEFINE THE TRAJECTORY ANGLE (X AND Y SPEED)
  currentBallXSpeed = Math.random() * 2 * maxXSpeed - maxXSpeed
  currentBallZSpeed = Math.random() * 2 * maxYSpeed - maxYSpeed

  const magnitude = (currentBallXSpeed ** 2 + maxZSpeed ** 2 + currentBallZSpeed ** 2) ** 0.5

  currentBallXSpeed = (currentBallXSpeed * maxZSpeed) / magnitude
  currentBallZSpeed = (currentBallZSpeed * maxZSpeed) / magnitude

  currentBall.name = currentBallName
  balls[currentBall.name] = {
    'child': currentBallChild,
    'points': currentBallPoints,
    'xSpeed': currentBallXSpeed,
    'zSpeed': currentBallZSpeed,
    'timeLeft': currentBallTimeLeft,
    'color': currentBallColor,
  }

  timerModel.rotation.y = Math.PI
  // timerModel.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)

  if (timerTotal === 0) {
    timerModel.children[0].children[0].material = redBallMat
  } else if (timerTotal === 1) {
    timerModel.children[0].children[0].material = blueBallMat
  } else if (timerTotal === 2) {
    timerModel.children[0].children[0].material = greenBallMat
  } else {
    timerModel.children[0].children[0].material = yellowBallMat
  }
  launchedChrono = true
  if (timerTotal < 3) {
    setTimeout(spawnChrono, 7000)
    timerTotal += 1
  }
}
const spawnNewBallHandler = () => {
  if (!gameStarted) {
    return
  }
  if (!launchedChrono && timeLeft < timeTotal - 7) {
    spawnChrono()
    //  ASK FOR A NEW THROW IN x SECONDS
    setTimeout(spawnNewBallHandler, ballFrequency)
    return
  }
  ballTotal += 1
  // Returns a random integer from 1 to 10:
  const random = Math.floor(Math.random() * 10) + 1

  // GENERATE A RANDOM BALL AMONG THE 4 DIFFERENT COLOURS
  // AND ENVELOP IT IN A BIGGER ONE FOR EASIER TOUCH DETECTION.
  const currentBall = new THREE.Mesh(ballGeometry, transparentMat)
  currentBall.scale.x = 15
  currentBall.scale.y = 15
  currentBall.scale.z = 15

  let currentBallChild
  let currentBallPoints
  let currentBallXSpeed
  let currentBallZSpeed
  let currentBallTimeLeft = 3
  let currentBallColor
  const currentBallName = ballTotal.toString()

  if (random === 1) {
    currentBallChild = new THREE.Mesh(ballGeometry, yellowBallMat)
    currentBallPoints = 500
    currentBallColor = 'yellow'
  } else if (random === 2 || random === 3) {
    currentBallChild = new THREE.Mesh(ballGeometry, greenBallMat)
    currentBallPoints = 300
    currentBallColor = 'green'
  } else if (random === 4 || random === 5) {
    currentBallChild = new THREE.Mesh(ballGeometry, blueBallMat)
    currentBallPoints = 200
    currentBallColor = 'blue'
  } else if (random === 6 || (currentScore > secondBlackBallThreshold && random === 7) ||
    (currentScore > thirdBlackBallThreshold && random === 8)) {
    currentBallChild = new THREE.Mesh(ballGeometry, blackBallMat)
    currentBallPoints = -200
    currentBallColor = 'black'
  } else {
    currentBallChild = new THREE.Mesh(ballGeometry, redBallMat)
    currentBallPoints = 100
    currentBallColor = 'red'
  }

  ballGroup.add(currentBall)
  currentBall.add(currentBallChild)
  currentBallChild.scale.x = 0.75
  currentBallChild.scale.y = 0.75
  currentBallChild.scale.z = 0.75

  //  DEFINE THE TRAJECTORY ANGLE (X AND Y SPEED)
  currentBallXSpeed = Math.random() * 2 * maxXSpeed - maxXSpeed
  currentBallZSpeed = Math.random() * 2 * maxYSpeed - maxYSpeed

  const magnitude = (currentBallXSpeed ** 2 + maxZSpeed ** 2 + currentBallZSpeed ** 2) ** 0.5

  currentBallXSpeed = (currentBallXSpeed * maxZSpeed) / magnitude
  currentBallZSpeed = (currentBallZSpeed * maxZSpeed) / magnitude

  if (currentBallColor === 'black') {
    currentBallTimeLeft = 5
  }
  currentBall.name = currentBallName
  balls[currentBall.name] = {
    'child': currentBallChild,
    'points': currentBallPoints,
    'xSpeed': currentBallXSpeed,
    'zSpeed': currentBallZSpeed,
    'timeLeft': currentBallTimeLeft,
    'color': currentBallColor,
  }
  //  ASK FOR A NEW THROW IN x SECONDS
  setTimeout(spawnNewBallHandler, ballFrequency)
}

const currentBallUpdate = () => {
  delta = clock.getDelta()
  const keys = Object.keys(balls)
  if (keys.length < 1) {
    return
  }
  for (let i = 0; i < keys.length; i++) {
    const ball = ballGroup.getObjectByName(keys[i])
    if (balls[ball.name].color === 'black') {
      ball.position.x += delta * (balls[ball.name].xSpeed / 2)
      if (currentScore > 5000) {
        ball.position.y += delta * (maxZSpeed / 4)
      } else if (currentScore > 2500) {
        ball.position.y += delta * (maxZSpeed / 3)
      } else {
        ball.position.y += delta * (maxZSpeed / 2)
      }
      ball.position.z += delta * (balls[ball.name].zSpeed / 2)
    } else {
      ball.position.x += delta * balls[ball.name].xSpeed
      ball.position.y += delta * (maxZSpeed + speedChangePerPoint * currentScore)
      ball.position.z += delta * balls[ball.name].zSpeed
    }

    // if (balls[ball.name].color === 'timer') {
    // ball.rotation.y += delta * timerRotationSpeed
    // }
    balls[ball.name].timeLeft -= delta
    if (balls[ball.name].timeLeft <= 0) {
      destroyBallHandler(ball, false)
    }
  }
}

//#endregion

//#region GAME STATES
const gameEnd = () => {
  gameStarted = false

  const keys = Object.keys(balls)
  for (let i = 0; i < keys.length; i++) {
    destroyBallHandler(ballGroup.getObjectByName(keys[i]), false)
  }

  scene.remove(computer)
  const sound = document.getElementById('music')
  sound.pause()
  sound.currentTime = 0

  balls = {}

  gameDiv = document.getElementById('gameDiv')
  gameDiv.style.display = 'none'

  parentDiv.style.pointerEvents = 'inherit'
  if (currentScore > 0) {
    endgameDiv.style.display = 'inherit'
    endgameDiv.style.pointerEvents = 'inherit'
    finalScore.innerText = `${currentScore} points`
  } else {
    loseDiv.style.display = 'inherit'
    loseDiv.style.pointerEvents = 'inherit'
  }
}

const gameStart = () => {
  if (!document.getElementById('AccepterCGU').checked) {
    return
  }
  gameStarted = true
  placed = false
  timeLeft = timeTotal
  currentScore = 0
  launchedChrono = false
  timerTotal = 0
  balls = {}
  tutorialDiv.style.display = 'none'
  endgameDiv.style.display = 'none'
  win10Div.style.display = 'none'
  loseDiv.style.display = 'none'
  gameDiv = document.getElementById('gameDiv')
  gameDiv.style.display = 'flex'
  playUi.style.display = 'flex'
  scoreUi.innerText = ''
  timeUi.innerText = ''
  parentDiv.style.pointerEvents = 'none'
}

const winResult = () => {
  spinDiv.style.pointerEvents = 'none'
  spinDiv.style.display = 'none'
  const rand = Math.floor(Math.random() * 3)
  if (rand === 0) {
    loseDiv.style.display = 'inherit'
    loseDiv.style.pointerEvents = 'inherit'
  }
  if (rand === 1) {
    document.getElementById('reduction').innerText = '10 %'
    document.getElementById('couponButton').setAttribute('href', '#10')
    win10Div.style.display = 'inherit'
    win10Div.style.pointerEvents = 'inherit'
  }
  if (rand === 2) {
    document.getElementById('reduction').innerText = '70 %'
    document.getElementById('couponButton').setAttribute('href', '#70')
    win10Div.style.display = 'inherit'
    win10Div.style.pointerEvents = 'inherit'
  }
}

const spinWheel = () => {
  endgameDiv.style.pointerEvents = 'none'
  endgameDiv.style.display = 'none'
  spinDiv.style.pointerEvents = 'inherit'
  spinDiv.style.display = 'inherit'
  setTimeout(winResult, 3000)
}

const gameTutorial = () => {
  uspDiv.style.display = 'none'
  uspDiv.style.pointerEvents = 'none'
  tutorialDiv.style.display = 'inherit'
  tutorialDiv.style.pointerEvents = 'inherit'
  tutorialDiv.getElementsByTagName('button')[0].addEventListener('click', gameStart, true)
  playUi = document.getElementById('play-text')
  scoreUi = document.getElementById('score-ui')
  timeUi = document.getElementById('time-ui')
  parentDiv = document.getElementById('parent')
  finalScore = document.getElementById('finalScore')
  endgameDiv.getElementsByTagName('button')[0].addEventListener('click', spinWheel, true)
  win10Div = document.getElementById('win10Div')
  document.getElementById('replayButton').addEventListener('click', gameStart, false)
  document.getElementById('shareButton').addEventListener('click', socialMediaShare, false)
  loseDiv = document.getElementById('loseDiv')
  document.getElementById('replayLose').addEventListener('click', gameStart, false)
  document.getElementById('shareLose').addEventListener('click', socialMediaShare, false)
}

const uspDisplay = () => {
  welcomeDiv = document.getElementById('welcomeDiv')
  welcomeDiv.style.display = 'none'
  welcomeDiv.style.pointerEvents = 'none'
  uspDiv = document.getElementById('uspDiv')
  uspDiv.getElementsByTagName('button')[0].addEventListener('click', gameTutorial, true)
  tutorialDiv = document.getElementById('tutorialDiv')
  tutorialDiv.style.pointerEvents = 'none'
  spinDiv = document.getElementById('spinDiv')
  spinDiv.style.pointerEvents = 'none'
  endgameDiv = document.getElementById('endgameDiv')
  endgameDiv.style.pointerEvents = 'none'
}

//#endregion

//#region MODEL SPAWN
const spawnModel = () => {
  ballGroup = new THREE.Group()
  computer.position.set(0.0, 0.0, 0.0)
  computer.scale.set(endScale.x, endScale.y, endScale.z)
  computer.castShadow = true
  scene.add(computer)
  computer.add(ballGroup)
  ballGroup.position.z = 5
  ballGroup.position.y = 5
  computer.lookAt(camera.position.x, 0, camera.position.z)
  computer.rotateOnAxis(computer.up, Math.PI)
  setTimeout(spawnNewBallHandler, 1000)
  document.getElementById('music').play()
}

// Load the glb model at the requested point on the surface.
const placeObject = () => {
  spawnModel()
}

//#endregion

//#region INPUTS
const mouseHandler = (e) => {
  if (!gameStarted) {
    return
  }

  // calculate tap position in normalized device coordinates (-1 to +1) for both components.
  mousePos.x = (e.clientX / window.innerWidth) * 2 - 1
  mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1

  // Update the picking ray with the camera and tap position.
  raycaster.setFromCamera(mousePos, camera)
  if (placed) {
    const intersects = raycaster.intersectObjects(ballGroup.children)

    if (intersects.length > 0) {
      const ball = intersects[0].object
      destroyBallHandler(ball, true)
    }
  } else {
    playUi.style.display = 'none'
    gameDiv.style.pointerEvents = 'none'
    placed = true
    placeObject()
    updateScore()
  }
}

const updateTime = () => {
  if (!gameStarted || !placed) {
    return
  }
  timeLeft -= delta
  updateScore()
  if (timeLeft <= 0) {
    gameEnd()
  }
}
//#endregion

//#region START
// Add objects to the scene and set starting camera position.
initScene()

initializeVariables()
ballsSetupHandler()
generateBoxes()

// Enable TWEEN animations.
const animate = (time) => {
  currentBallUpdate()
  updateBoxEffects()
  requestAnimationFrame(animate)

  updateTime()
  updateScoreText()
  renderer.render(scene, camera)
}

window.addEventListener('resize', 
    () => {
      console.log("test")
        camera.aspect = canvas.clientWidth/ canvas.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvas.clientWidth, canvas.clientHeight)
        renderer.render(scene, camera)
    }, 
    false)

loader.load(
  modelFile, // resource URL.
  (gltf) => {
    computer = gltf.scene
    loader.load(
      timerFile,
      (gltf2) => {
        timerModel = gltf2.scene
        timerModel.children[0].children[1].material = whiteBallMat
        uspDisplay()
        animate()
      }
    )
  }
)

//#endregion