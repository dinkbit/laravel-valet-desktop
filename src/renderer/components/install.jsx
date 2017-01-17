// Native
import {exec, execSync} from 'child_process'

// Packages
import {remote} from 'electron'
import React from 'react'

export default React.createClass({
  getInitialState() {
    return {
      installed: false,
      installing: false,
      done: false
    }
  },
  async installValet() {
    this.setState({
      installing: true
    })

    const showError = remote.getGlobal('errorHandler')

    exec('valet install', (error, stdout) => {
      if (error) {
        this.setState({
          installing: false,
          done: false
        })

        showError('Not able to install valet', error.toString())
        return
      }

      const output = stdout.toString()
      const expr = /Valet installed successfully/

      if (!expr.test(output)) {
        this.setState({
          installing: false,
          done: false
        })

        showError('Not able to install valet', output)
        return
      }

      this.setState({
        installing: false,
        done: true
      })
    })
  },
  async isInstalled() {
    let installedVersion

    try {
      installedVersion = execSync('valet -V').toString()
    } catch (err) {
      return
    }

    const expr = /Laravel Valet/

    return expr.test(installedVersion)
  },
  async componentDidMount() {
    if (!await this.isInstalled()) {
      return
    }

    const currentWindow = remote.getCurrentWindow()
    currentWindow.focus()

    this.setState({
      installed: true
    })
  },
  render() {
    const element = this

    let classes = 'button install'
    let installText = 'Install now'

    if (this.state.installed) {
      classes += ' off'
      installText = 'Already installed'
    }

    const installButton = {
      className: classes,
      async onClick() {
        if (element.state.installed) {
          return
        }

        await this.installValet(element)
      }
    }

    if (this.state.installing) {
      return (
        <article>
          <p className="install-status">
            <strong>Installing Valet</strong>

            <i>.</i>
            <i>.</i>
            <i>.</i>
          </p>
          <p>Please be so kind and leave the app open! We&#39;ll let you know once we are done. This should not take too long.</p>
        </article>
      )
    }

    if (this.state.done) {
      return (
        <article>
          <p><strong>Hooray! 🎉</strong></p>
          <p>Valet has been installed.</p>
          <p>You can now use <code>valet</code> from the command line.</p>
        </article>
      )
    }

    return (
      <article>
        <p>In addition to this app, you can also use <code>valet</code> from the command line, if you&#39;d like to.</p>
        <p>Press the button below to install it!.</p>

        <a {...installButton}>{installText}</a>
      </article>
    )
  }
})
