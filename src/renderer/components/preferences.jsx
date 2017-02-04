// Native
import {exec, execSync} from 'child_process'

// Packages
import {remote} from 'electron'
import React from 'react'

export default React.createClass({
  getInitialState() {
    return {
      currentDomain: '',
      newDomain: '',
      startAtLogin: true,
      saving: false
    }
  },
  async savePreferences() {
    remote.app.setLoginItemSettings({
      openAtLogin: this.state.openAtLogin
    })

    const showError = remote.getGlobal('errorHandler')

    if (this.state.currentDomain === this.state.newDomain) {
      return
    }

    this.setState({
      saving: true
    })

    const cmd = `valet domain ${this.state.newDomain}`

    exec(cmd, (error, stdout) => {
      if (error) {
        this.setState({
          saving: false
        })

        showError('Not able to set valet domain', error.toString())
        return
      }

      const output = stdout.toString()
      console.log(output)
      const expr = /Your Valet domain has been updated/

      if (!expr.test(output)) {
        this.setState({
          saving: false
        })

        showError('Not able to set valet domain', output)
        return
      }

      this.setState({
        saving: false,
        currentDomain: this.state.newDomain
      })
    })
  },
  async getSettings() {
    let domainTld

    try {
      domainTld = execSync('valet domain').toString()
    } catch (err) {
      return
    }

    this.setState({
      currentDomain: domainTld,
      newDomain: domainTld,
      openAtLogin: remote.app.getLoginItemSettings().openAtLogin
    })
  },
  async componentDidMount() {
    if (!await this.getSettings()) {
      return
    }

    const currentWindow = remote.getCurrentWindow()
    currentWindow.focus()
  },
  handleDomainChange(event) {
    this.setState({newDomain: event.target.value})
  },
  handleOALChange(event) {
    this.setState({openAtLogin: event.target.value})
  },
  render() {
    const element = this

    let classes = 'button button-block install'
    let saveText = 'Save'

    if (this.state.saving) {
      classes += ' off'
      saveText = 'Saving'
    }

    const saveButton = {
      className: classes,
      async onClick() {
        if (element.state.saving) {
          return
        }

        await element.savePreferences()
      }
    }

    return (
      <article>
        <div className="form-group">
          <label>
            Valet Domain
          </label>
          <br/>
          <input type="text" name="domain" className="input" value={this.state.newDomain} onChange={this.handleDomainChange}/>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" name="open-at-login" value={this.state.openAtLogin} onChange={this.handleOALChange}/> Open at login
          </label>
        </div>
        <a type="submit" {...saveButton}>{saveText}</a>
      </article>
    )
  }
})
