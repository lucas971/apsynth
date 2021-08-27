//Mettre le code hexadecimal de la couleur du background ici
const backgroundColor = 0xf4b400

//L'opacité du background (entre 0 et 1) : à 0, le background est complètement transparent.
const backgroundOpacity = 1

//#region VARIABLES

  // MODELS
  const streetFile = './assets/City.glb'
  const streetScale = new THREE.Vector3(0.0002, 0.0002, 0.0002)
  const robotFile = './assets/Robot.glb'
  const robotWalkFile = './assets/Robotwalk.glb'
  const robotIdleFile = './assets/Robotidle.glb'
  const batteryFile = './assets/Battery.glb'
  const timerFile = './assets/Timer.glb'
  let street
  let timerModel
  let robot
  let robotForward
  const playerPosWorld = new THREE.Vector3()
  const batteryPosWorld = new THREE.Vector3()
  const pickingDistance = 0.2

  // GENERAL THREE JS
  let renderer
  let camera
  let scene
  const raycaster = new THREE.Raycaster()
  const loader = new THREE.GLTFLoader()  // This comes from GLTFLoader.js.
  let surface  // Transparent surface for raycasting for object placement.
  let gameStarted = false
  // TIMER
  let timerTotal
  let timerPos
  let timerTimeout

  // CLOCK
  let delta
  const clock = new THREE.Clock()

  // GAME PARAMETERS
  const GameTime = 25
  let currentTime
  let currentScore

  // STREET
  let placed

  // BATTERIES
  const batteries = []
  const batteriesPos = []
  const batteriesPoints = []
  let blackBatteries = 0
  let blackTimeout

  // ROBOT
  const robotSpeed = -4000

  //  CSS
  let canvas
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
  const scoreTextSpeed = 1

  //  AUDIO
  let sound1
  let sound2

  // BOX EFFECT
  let boxEffectsColor
  let boxEffectsBlack
  const boxEffectDuration = 2
  let redBallMat
  let blueBallMat
  let yellowBallMat
  let greenBallMat
  let blackBallMat
  let whiteBallMat

  // MOUSE
  const mousePos = new THREE.Vector3()

  // CONTROLLER
  let currentDirection = 0;
  let currentlyPressed = false
  const robotForwardWorldPos = new THREE.Vector3()
  let road

  // ANIMATIONS
  let mixer
  const animationActions = []
  let activeAction
  let lastAction
  let walkAnimLoaded = false
  let idleAnimLoaded = false
  let lastWalk = 0
  const walkAnimationChrono = 2
//#endregion

//#region INIT
const initScene = () => {
  canvas = document.getElementById("threeJsCanvas")
  canvas.addEventListener('mousedown', mouseHandler, true) // Add touch listener.
  document.addEventListener('keydown', keyboardInput, true)
  document.addEventListener('keyup', stopKeyboardInput, true)
  renderer = new THREE.WebGLRenderer(canvas);
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor( backgroundColor, backgroundOpacity);
  canvas.appendChild(renderer.domElement)
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)

  const light = new THREE.DirectionalLight(0xffffff, 1, 5)
  light.position.set(1, 4.3, 2.5) // default

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth/ canvas.clientHeight, 0.1, 1000)
  scene.add(camera)

  scene.add(light) // Add soft white light to the scene.
  scene.add(new THREE.AmbientLight(0x404040, 3)) // Add soft white light to the scene.

  light.shadow.mapSize.width = 1024 // default
  light.shadow.mapSize.height = 1024 // default
  light.shadow.camera.near = 0.5 // default
  light.shadow.camera.far = 500 // default
  light.castShadow = true

  // Set the initial camera position relative to the scene we just laid out. This must be at a
  // height greater than y=0.
  camera.position.set(0, 3, 2)
  camera.rotation.x = -Math.PI/2 + Math.PI/6

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

const setAction = (toAction) => {
  if (toAction !== activeAction) {
    lastAction = activeAction
    activeAction = toAction
    lastAction.fadeOut(1)
    activeAction.reset()
    activeAction.fadeIn(1)
    activeAction.play()
  }
}

const walkAnim = () => {
  if (!walkAnimLoaded) {
    return
  }
  setAction(animationActions[1])
}

const idleAnim = () => {
  if (!idleAnimLoaded) {
    return
  }
  setAction(animationActions[0])
}

const SetupAnimations = () => {
  mixer = new THREE.AnimationMixer(robot)
  loader.load(
    robotIdleFile,
    (gltf) => {
      const animationAction = mixer.clipAction(gltf.animations[0])
      animationActions.push(animationAction)
      activeAction = animationActions[0]
      activeAction.reset()
      activeAction.fadeIn(1)
      activeAction.play()
      idleAnimLoaded = true
      loader.load(
        robotWalkFile,
        (gltf2) => {
          const animationAction = mixer.clipAction(gltf2.animations[0])
          animationActions.push(animationAction)
          walkAnimLoaded = true
        }
      )
    }
  )
}

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

// #region SCORE VFX

const updateScoreText = () => {
  if (!scoreTexts || scoreTexts.length === 0) {
    return
  }
  const toRemove = []
  for (let i = 0; i < scoreTexts.length; i++) {
    const textData = scoreTexts[i]
    textData.timeLeft -= delta
    const pos = toScreenPosition(textData.pos)
    textData.text.style.bottom = `${pos.y}px`
    textData.text.style.left = `${pos.x - 100}px`
    textData.pos.y += delta * scoreTextSpeed
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

const generateScoreText = (text) => {
  const screenPos = toScreenPosition(playerPosWorld)
  const textPos = playerPosWorld.clone()
  const text2 = document.createElement('div')
  const points = text
  text2.innerHTML = points
  text2.style.bottom = `${screenPos.y}px`
  text2.style.left = `${screenPos.x - 100}px`
  text2.className = 'scoreDynamic'
  document.body.appendChild(text2)

  const newTextData = {
    'text': text2,
    'pos': textPos,
    'timeLeft': scoreTextDuration,
  }

  scoreTexts.push(newTextData)
}

const updateScore = () => {
  scoreUi.innerText = `${currentScore.toString()} points`
  timeUi.innerText = `${currentTime.toFixed(0).toString()} sec. `
}

// #endregion

// #region BOX EFFECT
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
    street.remove(boxEffect[i])
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

const pickBox = (win) => {
  if (!win) {
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
const startBoxEffect = (win, position) => {
  const newBox = pickBox(win)

  for (let i = 0; i < newBox.boxes.length; i++) {
    const boxData = newBox.boxes[i]
    boxData.box.position.x = position.x
    boxData.box.position.y = position.y
    boxData.box.position.z = position.z

    boxData.box.scale.x = boxData.scale
    boxData.box.scale.y = boxData.scale
    boxData.box.scale.z = boxData.scale
    scene.add(boxData.box)
  }
  newBox.playing = true
  newBox.timeLeft = boxEffectDuration
}

const ballsSetupHandler = () => {
    redBallMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xdb4437,
      })
      blueBallMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0x4285f4,
      })
      greenBallMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0x0f9d58,
      })
      yellowBallMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xf4b400,
      })
      blackBallMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0x000000,
      })
      whiteBallMat = new THREE.MeshPhongMaterial({
        shininess: 15,
        color: 0xffffff,
        side : THREE.DoubleSide
      })
    }
    
const generateBoxes = () => {
  ballsSetupHandler()
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
      const boxSpeed = new THREE.Vector3(Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1)

      boxSpeed.multiplyScalar(1)
      const scale = Math.random() * 0.1
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

// #endregion

// #region CONTROLS

const MoveRobotForward = () => {
  robotForward.getWorldPosition(robotForwardWorldPos)
  raycaster.set(robotForwardWorldPos, new THREE.Vector3(0, -1, 0))

  const intersect = raycaster.intersectObjects(road, true)
  if (intersect.length > 0) {
    robot.translateZ(delta * robotSpeed)
    checkPickBatteries()
    walkAnim()
    lastWalk = clock.getElapsedTime()
  }
}
const TryMoveRobot = () => {
  if (!currentlyPressed) {
    return
  }
  robot.rotation.y = currentDirection
  MoveRobotForward()
}

const keyboardInput = (e) => {
  if (currentlyPressed) {
    return
  }

  if (e.key === "ArrowRight") {
    currentDirection = 3 * (Math.PI / 2) 
  }
  else if (e.key === "ArrowDown") {
    currentDirection = 2 * (Math.PI / 2) 
  }
  else if (e.key === "ArrowLeft") {
    currentDirection = 1 * (Math.PI / 2) 
  }
  else if (e.key === "ArrowUp") {
    currentDirection = 0 * (Math.PI / 2)
  }
  else {
    return
  }

  currentlyPressed = true
}

const stopKeyboardInput = () => {
  currentlyPressed = false;
}
// #endregion

// #region BATTERIES
const updateBatteries = () => {
  if (!placed) {
    return
  }

  for (let i = 0; i < batteries.length; i++) {
    batteries[i].rotation.z += delta * 3
  }
  timerModel.rotation.y += delta*2
}

const randomBatteryPoints = (index, black) => {
  if (black) {
    batteriesPoints[index] = -500
    for (let i = 0; i < 5; i++) {
      batteries[index].children[0].children[i].material = blackBallMat
    }
    return
  }
  // Returns a random integer from 1 to 4:
  const random = Math.floor(Math.random() * 4) + 1
  if (random > 4) {
    random = 4
  }
  let mat
  let points
  if (random === 1) {
    points = 100
    mat = redBallMat
  } else if (random === 2) {
    points = 200
    mat = blueBallMat
  } else if (random === 3) {
    points = 300
    mat = greenBallMat
  } else {
    points = 500
    mat = yellowBallMat
  }
  batteriesPoints[index] = points
  for (let i = 0; i < 5; i++) {
    batteries[index].children[0].children[i].material = mat
  }
}
const randomBatteryPos = () => {
  let random = -1
  while (random === -1) {
    random = Math.floor(Math.random() * road.length)
    if (random >= road.length) {
      random = road.length - 1
    }
    if (timerPos === random) {
      random = -1
      continue
    }
    for (let i = 0; i < batteriesPos.length; i++) {
      if (batteriesPos[i] === random) {
        random = -1
        continue
      }
    }
  }
  return random
}

const placeBattery = (index, black) => {
  if (batteries[index].parent) {
    batteries[index].parent.remove(batteries[index])
  }
  batteriesPos[index] = randomBatteryPos()
  randomBatteryPoints(index, black)

  road[batteriesPos[index]].add(batteries[index])
  batteries[index].position.set(0, 550, 0)
  batteries[index].rotation.set(Math.PI / 2 + Math.PI / 4, 0, 0)
  batteries[index].scale.set(1.5, 1.5, 1.5)
}

const placeBlackBattery = () => {
  if (!placed || blackBatteries + 3 >= batteries.length) {
    return
  }
  batteriesPos[blackBatteries + 3] = -1
  placeBattery(blackBatteries + 3, true)
  blackBatteries++
  blackTimeout = setTimeout(placeBlackBattery, 15000)
}

const placeBatteries = () => {
  batteriesPos[0] = -1
  batteriesPos[1] = -1
  batteriesPos[2] = -1
  for (let i = 0; i < 3; i++) {
    placeBattery(i, false)
  }
  blackTimeout = setTimeout(placeBlackBattery, 5000)
  timerTimeout = setTimeout(nextTimer, 10000)
  if (timerModel.parent) {
    timerModel.parent.remove(timerModel)
  }
}

const pickBattery = (index) => {
  if (index <= 2) {
    playSound(sound1)
    startBoxEffect(true, playerPosWorld)
    generateScoreText(`+${batteriesPoints[index].toString()} points`)
    currentScore += batteriesPoints[index]
    placeBattery(index, false)
  } else {
    playSound(sound2)
    startBoxEffect(false, playerPosWorld)
    generateScoreText('-500 points')
    currentScore -= 500
    batteries[index].parent.remove(batteries[index])
  }
}

const nextTimer = () => {
  if (timerModel.parent) {
    timerModel.parent.remove(timerModel)
  }

  timerModel.rotation.y = Math.PI

  if (timerTotal === 0) {
    timerModel.children[0].children[0].material = redBallMat
  } else if (timerTotal === 1) {
    timerModel.children[0].children[0].material = blueBallMat
  } else if (timerTotal === 2) {
    timerModel.children[0].children[0].material = greenBallMat
  } else {
    timerModel.children[0].children[0].material = yellowBallMat
  }

  timerPos = randomBatteryPos()
  road[timerPos].add(timerModel)
  timerModel.position.set(0, 750, 0)
  timerModel.rotation.y = Math.PI
  timerModel.scale.set(6, 6, 6)
  timerTotal++
}

const pickTimer = () => {
    timerModel.parent.remove(timerModel)
    playSound(sound1)
    startBoxEffect(true, playerPosWorld)
    generateScoreText(`+10 seconds`)
    currentTime += 10
    setTimeout(nextTimer, 1000)
}

const checkPickBatteries = () => {
    robot.getWorldPosition(playerPosWorld)
    for (let i = 0; i < batteries.length; i++) {
      if (batteries[i].parent != null) {
        batteries[i].getWorldPosition(batteryPosWorld)
        if (playerPosWorld.distanceTo(batteryPosWorld) < pickingDistance) {
          pickBattery(i)
          return
        }
      }
    }
    if (timerModel.parent) {
        timerModel.getWorldPosition(batteryPosWorld)
        if (playerPosWorld.distanceTo(batteryPosWorld) < pickingDistance) {
            pickTimer()
            return
        }
    }
  }
// #endregion

// #region GAME STATE CHANGE

const gameStart = () => {
  if (!document.getElementById('AccepterCGU').checked) {
    return
  }
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
  currentTime = GameTime
  currentScore = 0
  blackBatteries = 0
  timerTotal = 0
  gameStarted = true
  idleAnim()
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

const gameEnd = () => {
  placed = false
  clearTimeout(blackTimeout)
  clearTimeout(timerTimeout)
  scene.remove(street)
  const sound = document.getElementById('music')
  sound.pause()
  sound.currentTime = 0

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
// #endregion

//#region MODEL SPAWN
const spawnModel = () => {
  street.rotation.set(0.0, 0.0, 0.0)
  street.position.set(0.0, 0.0, 0.0)
  street.scale.set(streetScale.x, streetScale.y, streetScale.z)
  street.castShadow = true
  scene.add(street)
  street.add(robot)
  robot.rotation.y = Math.PI / 2
  robot.scale.set(2, 2, 2)
  robot.position.y += 100
  placed = true
  placeBatteries()
  clock.start()
  document.getElementById('music').play()
}

// Load the glb model at the requested point on the surface.
const placeObject = () => {
  spawnModel()
}

//#endregion

//#region INPUTS
const mouseHandler = (e) => {
  if (!gameStarted || placed) {
    return
  }

  // calculate tap position in normalized device coordinates (-1 to +1) for both components.
  mousePos.x = (e.clientX / window.innerWidth) * 2 - 1
  mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1

  // Update the picking ray with the camera and tap position.
  raycaster.setFromCamera(mousePos, camera)
  playUi.style.display = 'none'
  gameDiv.style.pointerEvents = 'none'
  placed = true
  placeObject()
  updateScore()
}

const updateTime = () => {
  if (!placed) {
    return
  }
  delta = clock.getDelta()
  currentTime -= delta
  updateScore()
  if (clock.getElapsedTime() > lastWalk + 2) {
    idleAnim()
  }
  if (currentTime <= 0) {
    gameEnd()
  }
}
//#endregion

//#region START
// Add objects to the scene and set starting camera position.
initScene()

generateBoxes()

// Enable TWEEN animations.
const animate = (time) => {
  updateBoxEffects()
  requestAnimationFrame(animate)
  updateTime()
  
  TryMoveRobot()
  updateScoreText()
  updateBatteries()
  renderer.render(scene, camera)
}

window.addEventListener('resize', 
    () => {
        camera.aspect = canvas.clientWidth/ canvas.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvas.clientWidth, canvas.clientHeight)
        renderer.render(scene, camera)
    }, 
    false)

loader.load(
  streetFile,  // resource URL.
  (gltf1) => {
    loader.load(robotFile,
      (gltf2) => {
        loader.load(batteryFile,
          (gltf3) => {
            loader.load(timerFile,
              (gltf4) => {
                street = gltf1.scene

                robot = gltf2.scene
                robotForward = new THREE.Mesh()
                robot.add(robotForward)
                robotForward.position.z = -200
                robotForward.position.y += 100

                road = []
                for (let i = 0; i < street.children.length; i++) {
                  if (street.children[i].name.includes('Road')) {
                    road.push(street.children[i])
                  }
                }

                batteries[0] = gltf3.scene
                batteries[1] = batteries[0].clone()
                batteries[2] = batteries[0].clone()
                batteries[3] = batteries[0].clone()
                batteries[4] = batteries[0].clone()
                batteries[5] = batteries[0].clone()
                batteries[6] = batteries[0].clone()
                batteries[7] = batteries[0].clone()
                batteries[8] = batteries[0].clone()
                SetupAnimations()

                timerModel = gltf4.scene
                timerModel.children[0].children[1].material = whiteBallMat

                uspDisplay()
              })
          })
      })
  }
)

animate()
//#endregion