Viajes Transparentes
============

Viajes Transparentes es una web app de código abierto hecha para difundir y comunicar información de transparencia gubernamental, en especial sobre viajes de funcionarios públicos
Hecha para el [RetoViajesTransparentes](http://ifai.codeandomexico.org)

#### Mejoras:

* Comparador de Servidores
* Comparador de Viajes
* Gráficas responsivas
* Tablas responsivas
* Interfaz mejorada y fácil de acceder
* Servicios REST ampliados
* Esquemas de base de datos ampliados
* Jobs
* Descarga de PDF con un click
* Se puede "seguir" a servidores públicos
* Preguntas abiertas a servidores públicos sobre sus viajes mediante login con facebook
* "¿Cuánto costaron viajes al mismo destino?" implementado
* Vistas en archivos separados de Jade


####¿Que tiene de bueno esta app?


* Es única, no esta hecha con plantillas ni scaffolds.

* Hecha con tecnologías ágiles, rápidas y modernas
    (NodeJS, Express, MongoDB, Jade, Stylus, Gulp, Bootstrap, HTML5.)
    
* Es súper facil de instalar y configurar: 
    
        git clone https://github.com/dantaex/viajes-transparentes
        cd viajes-transparentes && npm install
    
* Hecha con tecnologías 100% Open Source.

* Enfoque moderno: single page app (HTML5 History handling)

* Funciona mediante arquitectura REST, y la Api rest está abierta para consumo

* Tiene seguridad HMAC, por lo que no hay rieesgo de XSRF, ni siffing de passwords.

* Hospedada en la nube más robusta del mundo AWS-heroku (usada por Pinterest, Forsquare, Netflix, Nokia, ...)

* Sin sesiones, el servidor es 100% stateless, por lo que puede escalarse para atender a 10 millones de usuarios en 10 minutos.

* Suscripciones por email, servicio corriendo en Mailgun

* Es responsiva, probada en Android y iOS

* Funciona en Internet Explorer (en caso de que en verdad quieran probarlo ahí)

* El diseño gráfico de botones y figuras es exclusivo y único

####¿Qué cosas están implementadas?
Todo lo mencionado anteriormente, y de forma más específica:

* Intefaz responsiva
* HTML5
* Bootstrap layout
* Íconos SVG (retina ready)
* Navegación ajax (HTML5 history handling)
* Rendering clásico en homepage (SEO friendly)
* Compartir con un link (one link social share Facebook + Twitter, no plugins)
* Suscripción por email corriendo en Mailgun
* Búsqueda sensitiva optimizada (search autocomplete)
* Panel de control para administradores (subir datos)
* Validación del lado del cliente y del lado del servidor
* RESTful API
* Autenticación HMAC

####¿Qué cosas faltan por hacer?

* Gulp tasks 
* Minificar CSS, JS
* HTML5 storage
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
-
Home
![alt text](https://raw.githubusercontent.com/dantaex/viajes-transparentes/master/screenshot1.png "Viajes Transparentes")

-
Búsqueda rápida
![alt text](https://raw.githubusercontent.com/dantaex/viajes-transparentes/master/screenshot2.png "Viajes Transparentes")

-
Perfil de viajero (servidor)
![alt text](https://raw.githubusercontent.com/dantaex/viajes-transparentes/master/screenshot3.png "Viajes Transparentes")

-
Preguntas abiertas
![alt text](https://raw.githubusercontent.com/dantaex/viajes-transparentes/master/screenshot4.png "Viajes Transparentes")

-
Comparación de servidores públicos
![alt text](https://raw.githubusercontent.com/dantaex/viajes-transparentes/master/screenshot5.png "Viajes Transparentes")

##Demo
http://viajestransparentesv2.herokuapp.com/


##Carta 
https://www.dropbox.com/s/offjcrzkab23b3w/cartaprotestadecirverdadretoviajestransparentes.pdf?dl=0


##Contribuye

Este proyecto está totalmente abierto a  [código](https://github.com/dantaex/viajes-transparentes/pulls), [ideas](https://github.com/dantaex/viajes-transparentes/issues) y reporte de  [bugs](https://github.com/dantaex/viajes-transparentes/issues).

Si tienes alguna sugerencia, mándame un correo a <jesuslink00@gmail.com>

##Equipo

- [Angélica Tenorio](https://twitter.com/aixaimee)
- [Jesus Israel Cruz](https://github.com/dantaex)


##Licencia
MIT License
