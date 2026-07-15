pipeline {
  agent any
  options {
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }
  parameters {
    choice(name: 'ENVIRONMENT', choices: ['staging', 'production'],
           description: 'Target environment')
    choice(name: 'SUITE', choices: ['regression', 'auth', 'users', 'products', 'carts'],
           description: 'Test suite to run')
  }
  stages {
    stage('Install') {
      steps { sh 'npm ci' }
    }
    stage('Build Collections') {
      steps { sh 'npm run build:collections' }
    }
    stage('Test') {
      steps {
        sh """
          npx newman run collections/${params.SUITE}.collection.json \\
            --environment environments/${params.ENVIRONMENT}.environment.json \\
            --reporters cli,htmlextra,junit \\
            --reporter-htmlextra-export reports/report.html \\
            --reporter-junit-export reports/junit.xml
        """
      }
    }
    stage('Report') {
      post {
        always {
          archiveArtifacts artifacts: 'reports/**'
          junit 'reports/junit.xml'
          publishHTML([
            allowMissing: false,
            reportDir: 'reports',
            reportFiles: 'report.html',
            reportName: 'Newman API Report'
          ])
        }
      }
    }
  }
}
