// Packages
import {remote, shell} from 'electron'
import React from 'react'
import ReactDOM from 'react-dom'
import Slider from 'react-slick'
import SVGinline from 'react-svg-inline'
import timeAgo from 'time-ago'

// Ours
import pkg from '../../app/package'
import showError from './utils/error'

import Title from './components/title'
import Install from './components/install'
import Preferences from './components/preferences'

import logoSVG from './vectors/logo'
import arrowSVG from './vectors/arrow'

// Routes
const anchorWelcome = document.querySelector('#welcome-to-laravel-valet > div')
const anchorAbout = document.querySelector('#about-laravel-valet > div')
const anchorPreferences = document.querySelector('#preferences > div')

const SliderArrows = React.createClass({
  render() {
    return (
      <div {...this.props}>
        <SVGinline svg={arrowSVG} width="20px"/>
      </div>
    )
  }
})

const sliderSettings = {
  speed: 500,
  infinite: false,
  dots: true,
  draggable: false,
  accessibility: false,
  nextArrow: <SliderArrows direction="next"/>,
  prevArrow: <SliderArrows direction="prev"/>
}

const Sections = React.createClass({
  getInitialState() {
    return {
      tested: false
    }
  },
  handleReady() {
    const currentWindow = remote.getCurrentWindow()
    const aboutWindow = remote.getGlobal('about')

    // Close the tutorial
    currentWindow.emit('open-tray', aboutWindow)
  },
  arrowKeys(event) {
    const keyCode = event.keyCode
    const slider = this.slider

    switch (keyCode) {
      case 37:
        slider.slickPrev()
        break
      case 39:
        slider.slickNext()
        break
      default:
        return
    }

    event.preventDefault()
  },
  componentDidMount() {
    document.addEventListener('keydown', this.arrowKeys, false)
  },
  render() {
    const setRef = c => {
      this.slider = c
    }

    return (
      <Slider {...sliderSettings} ref={setRef}>
        <section id="intro">
          <SVGinline svg={logoSVG} width="90px"/>

          <h1>
            Laravel development environment for Mac minimalists
          </h1>
        </section>

        <section id="cli">
          <Install/>
        </section>
      </Slider>
    )
  }
})

const mainStyles = {
  height: 'inherit'
}

if (anchorWelcome) {
  ReactDOM.render((
    <main style={mainStyles}>
      <Title/>
      <Sections/>
    </main>
  ), anchorWelcome)
}

const AboutContent = React.createClass({
  getInitialState() {
    return {
      licenses: [],
      lastReleaseDate: ''
    }
  },
  async loadLicenses() {
    const links = document.querySelectorAll('a')

    for (const link of links) {
      const url = link.href

      if (url) {
        link.addEventListener('click', event => {
          shell.openExternal(url)
          event.preventDefault()
        })
      }
    }

    const getLicenses = remote.require('load-licenses')
    const mainModule = remote.process.mainModule

    this.setState({
      licenses: getLicenses(mainModule)
    })

    await this.lastReleaseDate()
  },
  async lastReleaseDate() {
    let data

    try {
      data = await fetch('https://api.github.com/repos/dinkbit/laravel-valet-desktop/releases')
    } catch (err) {
      console.log(err)
      return
    }

    if (!data.ok) {
      return
    }

    try {
      data = await data.json()
    } catch (err) {
      console.log(err)
      return
    }

    let localRelease

    for (const release of data) {
      if (release.tag_name === pkg.version) {
        localRelease = release
      }
    }

    if (!localRelease) {
      return
    }

    const ago = timeAgo().ago(new Date(localRelease.published_at))

    this.setState({
      lastReleaseDate: `(${ago})`
    })
  },
  async componentDidMount() {
    await this.loadLicenses()
  },
  handleWelcome() {
    const welcome = remote.getGlobal('welcome')

    if (!welcome) {
      showError('Not able to open welcome window')
      return
    }

    welcome.reload()

    welcome.on('ready-to-show', () => {
      welcome.show()
    })
  },
  prepareLicense(info) {
    let element = '<details>'

    element += `<summary>${info.name}</summary>`
    element += `<p>${info.license}</p>`
    element += '</details>'

    return element
  },
  readLicenses() {
    const licenses = this.state.licenses

    if (licenses.length === 0) {
      return ''
    }

    let elements = ''

    for (const license of licenses) {
      elements += this.prepareLicense(license)
    }

    return elements
  },
  render() {
    return (
      <section id="about">
        <span className="window-title">About</span>

        <img src="../dist/icons/icon.ico"/>

        <h1>Laravel Valet Desktop</h1>
        <h2>Version <b>{pkg.version}</b> {this.state.lastReleaseDate}</h2>

        <article>
          <h1>Authors</h1>

          <p>
            <a href="https://twitter.com/joecohens">Joseph Cohen</a><br/>
          </p>

          <h1>{'3rd party software'}</h1>
          <section dangerouslySetInnerHTML={{__html: this.readLicenses()}}/>
        </article>

        <span className="copyright">Made by <a href="http://dinkbit.com">dinkbit</a></span>

        <nav>
          <a href="https://laravel.com/docs/master/valet">Docs</a>
          <a href="https://github.com/dinkbit/laravel-valet-desktop">Source</a>
          <a onClick={this.handleWelcome}>Welcome</a>
        </nav>
      </section>
    )
  }
})

if (anchorAbout) {
  ReactDOM.render(<AboutContent/>, anchorAbout)
}

const PreferencesContent = React.createClass({
  render() {
    return (
      <section id="preferences">
        <span className="window-title">Preferences</span>
        <Preferences/>
      </section>
    )
  }
})

if (anchorPreferences) {
  ReactDOM.render(<PreferencesContent/>, anchorPreferences)
}
