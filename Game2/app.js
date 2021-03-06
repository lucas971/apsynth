// #region CONSTANTS AND VARIABLES

//Mettre le code hexadecimal de la couleur du background ici
const backgroundColor = 0x0843F1

//L'opacité du background (entre 0 et 1) : à 0, le background est complètement transparent.
const backgroundOpacity = 1

let savedRotation
const left = 1
const up = 2
const right = 3
const down = 4
let currentRotation = 0
let renderer
let scene
let camera
let canvas
let waitForPress

// CLOCK
let delta
const clock = new THREE.Clock()

// GAME PARAMETERS
const GameTime = 40
let currentTime
let currentScore
let placed

//  CSS
let welcomeDiv
let uspDiv
let tutorialDiv
let gameDiv
let endgameDiv
let spinDiv
let win10Div
let loseDiv
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

// FOLDERS
let red = 1
let green = 2
let blue = 3
let yellow = 4
const throwingSpeed = 2
let folderSrcs
const colorPoints = 200
let folder
const initialFolderPosRatio = new THREE.Vector3(0.5,0.62,0)
let startingPixelPos
const initialFolderWidth = 100
const initialFolderHeight = 100
let folderColor
let throwing = false
let throwProgress
let currentPixelPos
const targetPixelPos = new THREE.Vector3(0, 0, 0)
let computerTarget

// Everything Button
const everythingSpawnTime = 12
const everythingScreenDuration = 2
const everythingEffectDuration = 3
let everythingButtonSpawned
let everythingButtonInAction

// Computers
let middleComputer
let rightComputer
let leftComputer
let downComputer
let targetImage
let computerNormal
let computerEverything
let rightPosx
let middlePosx
let middlePosy
let topPos

const initialComputerWidth = 100
const initialComputerHeight = 100
const topComputerPosRatio = new THREE.Vector3(0.5,0.89,0)
const bottomComputerPosRatio = new THREE.Vector3(0.5,0.37,0)
const rightComputerPosRatio = new THREE.Vector3(0.75,0.62,0)
const leftComputerPosRatio = new THREE.Vector3(0.25,0.62,0)
let computerPos =[]

// #endregion

// #region INIT

// Populates some object into an XR scene and sets the initial camera position. The scene and
// camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
const initScene = () => {
  canvas = document.getElementById("threeJsCanvas")
  document.addEventListener('keydown', keyboardInput, true)

  renderer = new THREE.WebGLRenderer({domElement:canvas, alpha:true});
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor( backgroundColor, backgroundOpacity);
  canvas.appendChild(renderer.domElement)
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)

  scene = new THREE.Scene()

  const light = new THREE.DirectionalLight(0xffffff, 1, 100)
  light.position.set(1, 4.3, 2.5) // default
  
  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth/ canvas.clientHeight, 0.1, 1000)
  scene.add(camera)

  scene.add(light) // Add soft white light to the scene.
  scene.add(new THREE.AmbientLight(0x404040, 1)) // Add soft white light to the scene.

  light.shadow.mapSize.width = 1024 // default
  light.shadow.mapSize.height = 1024 // default
  light.shadow.camera.near = 0.5 // default
  light.shadow.camera.far = 500 // default
  light.castShadow = true

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

// #region AUXILIARIES

const generateMaterials = () => {
  folderSrcs = []
  folderSrcs[red] = './assets/Folders/red.svg'
  folderSrcs[blue] = './assets/Folders/blue.svg'
  folderSrcs[green] = './assets/Folders/green.svg'
  folderSrcs[yellow] = './assets/Folders/yellow.svg'

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
}

const toScreenPosition = (p) => {
  const vector = p.clone().project(camera)
  vector.x = ((vector.x + 1) / 2) * window.innerWidth
  vector.y = (1 - (-((vector.y - 1) / 2))) * window.innerHeight
  return vector
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
// #endregion

// #region SCORE VFX

const updateScoreText = () => {
  if (!scoreTexts || scoreTexts.length === 0) {
    return
  }
  const toRemove = []
  for (let i = 0; i < scoreTexts.length; i++) {
    const textData = scoreTexts[i]
    textData.timeLeft -= delta
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
  const text2 = document.createElement('div')
  const points = text
  text2.innerHTML = points
  text2.style.bottom = `${parentDiv.clientHeight / 2}px`
  text2.style.left = `${parentDiv.clientWidth / 2}px`
  text2.className = 'scoreDynamic'
  document.body.appendChild(text2)

  const newTextData = {
    'text': text2,
    'timeLeft': scoreTextDuration,
  }

  scoreTexts.push(newTextData)
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
    scene.remove(boxEffect[i])
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

// #region FOLDER MANAGEMENT

const throwEverythingFolder = () => {
  computerTarget = folderColor
  throwing = true
  throwProgress = 0.01
}
const throwFolder = (color) => {
  savedRotation = color
  if (color === up) {
    computerTarget = green
  } else if (color === left) {
    computerTarget = red
  } else if (color === right){
    computerTarget = blue
  } else {
    computerTarget = yellow
  }

  throwing = true
  currentRotation = 0
  throwProgress = 0.01
}

const createNewFolder = () => {
  computerTarget = 0
  let randomColor = 1 + Math.floor(Math.random() * 4)
  if (randomColor === 5) {
    randomColor = 4
  }
  if (randomColor === folderColor) {
    randomColor += 1
    if (randomColor === 5) {
      randomColor = 1
    }
  }
  folder.src = folderSrcs[randomColor]
  folder.style.left = `${(startingPixelPos.x).toString()}px`
  folder.style.bottom = `${(startingPixelPos.y).toString()}px`
  folder.style.width = `${initialFolderWidth.toString()}px`
  folder.style.height = `${initialFolderHeight.toString()}px`
  folderColor = randomColor

  if (everythingButtonInAction) {
    throwEverythingFolder()
  }
}

const folderScored = () => {
  throwing = false
  if (folderColor === computerTarget) {
    currentScore += colorPoints
    generateScoreText(`+${colorPoints} points`)
    playSound(sound1)
    if (savedRotation === up) {
      sentUp(true)
    }
    else if (savedRotation === left) {
      sentLeft(true)
    }
    else if (savedRotation === right){
      sentRight(true)
    } 
    else {
      sentDown(true)
    }
  } else if (computerTarget >= 0) {
    currentScore -= 100
    generateScoreText('-100 points')
    playSound(sound2)
    if (savedRotation === up) {
      sentUp(false)
    }
    else if (savedRotation === left) {
      sentLeft(false)
    }
    else if (savedRotation === right){
      sentRight(false)
    } 
    else {
      sentDown(false)
    }
  }

  createNewFolder()
}

const initializeFolder = () => {
  folder = document.getElementById('folder')
  folder.style.display = 'inherit'
  startingPixelPos = new THREE.Vector3(
    parentDiv.clientWidth * initialFolderPosRatio.x - initialFolderWidth/2, 
    parentDiv.clientHeight * initialFolderPosRatio.y - initialFolderHeight/2, 
    0)
  currentPixelPos = startingPixelPos.clone()

  targetImage = document.getElementById('target')
  targetImage.style.display = 'inherit'
  computerNormal = document.getElementById('computerNormal')
  computerEverything = document.getElementById('computerEverything')
  targetImage.style.left = `${(startingPixelPos.x - 6).toString()}px`
  targetImage.style.bottom = `${(startingPixelPos.y - 8).toString()}px`
  targetImage.style.width = `${(initialComputerWidth + 10).toString()}px`
  targetImage.style.height = `${(initialComputerHeight+ 10).toString()}px`
  targetImage.style.display = 'inherit'

  createNewFolder()
}

const updateComputerPos = () => {
  computerPos[up] = new THREE.Vector3(
    parentDiv.clientWidth * topComputerPosRatio.x - initialComputerWidth/2,
    parentDiv.clientHeight * topComputerPosRatio.y - initialComputerHeight/2,
    0
  )
  computerPos[down] = new THREE.Vector3(
    parentDiv.clientWidth * bottomComputerPosRatio.x - initialComputerWidth/2,
    parentDiv.clientHeight * bottomComputerPosRatio.y - initialComputerHeight/2,
    0
  )
  computerPos[right] = new THREE.Vector3(
    parentDiv.clientWidth * rightComputerPosRatio.x - initialComputerWidth/2,
    parentDiv.clientHeight * rightComputerPosRatio.y - initialComputerHeight/2,
    0
  )
  computerPos[left] = new THREE.Vector3(
    parentDiv.clientWidth * leftComputerPosRatio.x - initialComputerWidth/2,
    parentDiv.clientHeight * leftComputerPosRatio.y - initialComputerHeight/2,
    0
  )

  leftComputer.style.left = `${computerPos[left].x.toString()}px`
  leftComputer.style.bottom = `${computerPos[left].y.toString()}px`
  leftComputer.style.width = `${initialComputerWidth.toString()}px`
  leftComputer.style.height = `${initialComputerHeight.toString()}px`
  leftComputer.style.display = 'inherit'

  rightComputer.style.left = `${computerPos[right].x.toString()}px`
  rightComputer.style.bottom = `${computerPos[right].y.toString()}px`
  rightComputer.style.width = `${initialComputerWidth.toString()}px`
  rightComputer.style.height = `${initialComputerHeight.toString()}px`
  rightComputer.style.display = 'inherit'

  middleComputer.style.left = `${computerPos[up].x.toString()}px`
  middleComputer.style.bottom = `${computerPos[up].y.toString()}px`
  middleComputer.style.width = `${initialComputerWidth.toString()}px`
  middleComputer.style.height = `${initialComputerHeight.toString()}px`
  middleComputer.style.display = 'inherit'

  downComputer.style.left = `${computerPos[down].x.toString()}px`
  downComputer.style.bottom = `${computerPos[down].y.toString()}px`
  downComputer.style.width = `${initialComputerWidth.toString()}px`
  downComputer.style.height = `${initialComputerHeight.toString()}px`
  downComputer.style.display = 'inherit'
}
const initializeComputers = () => {
  leftComputer = document.getElementById('leftComputer')
  rightComputer = document.getElementById('rightComputer')
  middleComputer = document.getElementById('middleComputer')
  downComputer = document.getElementById('bottomComputer')
  updateComputerPos()
}
const tryToLaunch = () => {
  if (placed && currentRotation !== 0 && computerTarget === 0) {
    throwFolder(currentRotation)
  }
}
// #endregion

// #region CONTROLS

const keyboardInput = (e) => {
  if (e.key === "ArrowRight") {
    currentRotation = right 
  }
  else if (e.key === "ArrowLeft") {
    currentRotation = left
  }
  else if (e.key === "ArrowUp") {
    currentRotation = up
  }
  else if (e.key === "ArrowDown"){
    currentRotation = down
  }
  else if (everythingButtonSpawned) {
    activateEverythingEffect()
  }
}

// #endregion

// #region SHUFFLE

const shuffle = (a) => {
  let j
  let x
  let
    i
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = a[i]
    a[i] = a[j]
    a[j] = x
  }
  return a
}

const switchColors = () => {
  if (throwing) {
    setTimeout(switchColors, ((1 - throwProgress) / throwingSpeed) * 1000 + 100)
    return
  }
  if (!placed) {
    return
  }
  let randomColors = [1, 2, 3, 4]
  randomColors = shuffle(randomColors)
  red = randomColors[0]
  green = randomColors[1]
  blue = randomColors[2]
  yellow = randomColors[3]
  leftComputer.src = folderSrcs[randomColors[0]]
  middleComputer.src = folderSrcs[randomColors[1]]
  rightComputer.src = folderSrcs[randomColors[2]]
  downComputer.src = folderSrcs[randomColors[3]]
  folderColorChanged()

  if (currentTime > 5) {
    setTimeout(switchColors, 3000)
  }
}

// #endregion

// #region EVERYTHING BUTTON

const hideEverythingButton = () => {
  computerEverything.style.display = 'none'
  computerEverything.style.pointerEvents = 'none'
  computerNormal.style.display = 'inherit'
  computerNormal.style.pointerEvents = 'inherit'
  everythingButtonSpawned = false
}

const showEverythingButton = () => {
  everythingButtonSpawned = true
  computerEverything.style.display = 'inherit'
  computerEverything.style.pointerEvents = 'inherit'
  computerNormal.style.display = 'none'
  computerNormal.style.pointerEvents = 'none'
  setTimeout(hideEverythingButton, everythingScreenDuration * 1000)
}

const stopEverythingEffect = () => {
  everythingButtonInAction = false
}

const activateEverythingEffect = () => {
  everythingButtonInAction = true
  throwEverythingFolder()
  hideEverythingButton()
  setTimeout(stopEverythingEffect, everythingEffectDuration * 1000)
}

// #endregion

// #region GAME STATE CHANGE

const pressedScreen = () => {
  if (!waitForPress) {
    return
  }
  placed = true
  clock.start()
  document.getElementById('music').play()
  initializeFolder()
  initializeComputers()
  setTimeout(switchColors, 3000)
  setTimeout(showEverythingButton, 12000)
  setTimeout(showEverythingButton, 25000)
  waitForPress = false
  document.getElementById('play-text').style.display = 'none'
}

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
  document.getElementById('play-text').style.display = 'flex'
  scoreUi.innerText = ''
  timeUi.innerText = ''
  parentDiv.style.pointerEvents = 'none'

  everythingButtonSpawned = false
  everythingButtonInAction = false
  currentTime = GameTime
  currentScore = 0
  waitForPress = true
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
  document.addEventListener('keydown', pressedScreen)
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
// #endregion

// #region TRIGGERS

//The folders swapped colors
const folderColorChanged = () => {

}

//The file reached the top of the screen. If scored == true, that means the color match.
const sentUp = (scored) => {

}

//The file reached the bottom of the screen. If scored == true, that means the color match.
const sentDown = (scored) => {

}

//The file reached the right of the screen. If scored == true, that means the color match.
const sentRight = (scored) => {

}

//The file reached the left of the screen. If scored == true, that means the color match.
const sentLeft = (scored) => {

}

// #endregion

// #region UPDATE

const updateScore = () => {
  scoreUi.innerText = `${currentScore.toString()} points`
  timeUi.innerText = `${currentTime.toFixed(0).toString()} sec. `
}

function easeInOutQuad(t, b, c, d) {
  if ((t /= d / 2) < 1) return c / 2 * t * t + b
  return -c / 2 * ((--t) * (t - 2) - 1) + b
}

const updateThrow = () => {
  if (!throwing) {
    return
  }

  throwProgress += delta * throwingSpeed

  // If the folder lands on the computer
  if (throwProgress > 1) {
    folderScored()
    return
  }

  if (computerTarget === blue) {
    targetPixelPos.set(computerPos[right].x + initialComputerWidth/2, computerPos[right].y + initialComputerHeight/2, 0)
  } else if (computerTarget === red) {
    targetPixelPos.set(computerPos[left].x + initialComputerWidth/2, computerPos[left].y + initialComputerHeight/2, 0)
  } else if (computerTarget === green) {
    targetPixelPos.set(computerPos[up].x + initialComputerWidth/2, computerPos[up].y + initialComputerHeight/2, 0)
  } else {
    targetPixelPos.set(computerPos[down].x + initialComputerWidth/2, computerPos[down].y + initialComputerHeight/2, 0)
  }

  currentPixelPos.copy(targetPixelPos)
  currentPixelPos.sub(startingPixelPos)
  const bx = startingPixelPos.x
  const by = startingPixelPos.y
  const cx = currentPixelPos.x
  const cy = currentPixelPos.y
  const t1 = throwProgress
  const x = easeInOutQuad(t1, bx, cx, 1)
  const t2 = throwProgress
  const y = easeInOutQuad(t2, by, cy, 1)

  currentPixelPos.set(x, y, 0)
  folder.style.left = `${currentPixelPos.x.toString()}px`
  folder.style.bottom = `${(currentPixelPos.y).toString()}px`
  folder.style.width = `${((1 - throwProgress) * initialFolderWidth).toString()}px`
  folder.style.height = `${((1 - throwProgress) * initialFolderHeight).toString()}px`
}

const updateTime = () => {
  if (!placed) {
    return
  }
  delta = clock.getDelta()
  currentTime -= delta
  updateScore()
  if (currentTime <= 0) {
    gameEnd()
  }
}

// #endregion

// #region START

// INITIALIZATION

initScene()
generateMaterials()
generateBoxes()

setTimeout(uspDisplay, 1000)

const animate = () => {
  requestAnimationFrame(animate)

  updateTime()
  updateThrow()
  updateScoreText()
  updateBoxEffects()
  tryToLaunch()
  renderer.render(scene, camera)
}
window.addEventListener('resize', 
    () => {
      console.log("test")
        camera.aspect = canvas.clientWidth/ canvas.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvas.clientWidth, canvas.clientHeight)
        initializeFolder()
        updateComputerPos()
        renderer.render(scene, camera)
    }, 
    false)
animate()

// #endregion