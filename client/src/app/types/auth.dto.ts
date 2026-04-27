import { User } from "./user"
export interface UserDTO {
    success:boolean,
    message:string,
    user:User
}

export interface refreshDTO {
    success:boolean,
    message:string,
    accessToken:string
}

