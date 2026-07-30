import { Router } from 'express'
import { RolController } from '../controllers/rolController'



export class RolRoutes {
    static get routes(): Router {
        const router= Router()
        const controller=new RolController()
        
        router.get('/',controller.get)
        router.get('/:id',controller.getById)
        return router
    }


}