Sección para agregar la licencia. Recuerda agregar el LICENSE.txt al repositorio.
Viajes Transparentes
============

Viajes Transparentes es una web app de código abierto hecha para difundir y comunicar información de transparencia gubernamental, en especial sobre viajes de funcionarios públicos
Hecha para el [RetoViajesTransparentes](http://ifai.codeandomexico.org)

Hecho
* Intefaz responsiva, intuitiva, sencilla, limpia y única (sin templates)
* HTML5
* Bootstrap layout
* Íconos SVG (retina ready)
* Navegación ajax (HTML5 history handling)
* Rendering clásico en homepage (SEO friendly)
* Compartir con un link (one link social share Facebook + Twitter, no plugins)
* Libre de JQuery
* Suscripción por email corriendo en Mailgun
* Búsqueda sensitiva optimizada (search autocomplete)
* Panel de control para administradores (subir datos)
* Validación del lado del cliente y del lado del servidor
* RESTful API
* Autenticación HMAC (Sin sesiones para persistir, sin vulnerabilidad  XSRF, sin transmisión de password)  

Por Hacer
* Gulp tasks 
* Minificar CSS, JS
* One click PDF download
* Seguir a un servidor público
* HTML5 storage
* Búsqueda por rango de fechas
* Conectar con foursquare

##Dependencias

package.json

    {
      "name": "application-name",
      "version": "0.0.1",
      "private": true,
      "scripts": {
        "start": "node app.js"
      },
      "dependencies": {
        "express": "3.3.7",
        "jade": "*",
        "mongoose": "~3.8.16",
        "stylus": "~0.49.1",
        "underscore": "~1.7.0",
        "moment": "~2.8.3",
        "underscore.string": "~2.3.3",
        "mailgun-js": "~0.6.7"
      },
      "devDependencies": {
        "gulp": "~3.8.8"
      }
    }


##Instalación / Configuración 
    
    git clone 
    cd viajes-transparentes && npm install

##Screenshots
[Snapshot](https://raw.githubusercontent.com/dantaex/viajes-transparentes/master/snapshot.png)

##Demo
http://demovt.herokuapp.com/

##Contribuye


Este proyecto está totalmente abierto a  [código](https://github.com/dantaex/viajes-transparentes/pulls), [ideas](https://github.com/dantaex/viajes-transparentes/issues) y reporte de  [bugs](https://github.com/dantaex/viajes-transparentes/issues).

Si tienes alguna sugerencia, mándame un correo a <jesuslink00@gmail.com>

##Equipo

- [Angélica Tenorio](https://twitter.com/aixaimee)
- [Jesus Israel Cruz](https://github.com/dantaex)


##Licencia
MIT License
