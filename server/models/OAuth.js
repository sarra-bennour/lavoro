
const { default: mongoose } = require('mongoose');

const mongo = require('mongoose');
const Schema = mongo.Schema;

const OAuth = new Schema(
    {
        id: {
            type: mongoose.Schema.Types.UUID,
            default: () => new mongoose.Types.UUID(),
            unique: true,
            required: true,
          },

         
          firstName: {
            type: String, required: true 
          },
          
          lastName: {
             type: String
           },
           email: { 
            type: String, required: true, unique: true 

           },
          image: { 
            type: String ,
          user_id: {
            type: mongoose.Schema.Types.UUID,
            required: true,

          },
          provider: {
            type: String,
            required: true,
            enum: ["Google", "GitHub"], // Tu peux ajouter d'autres providers ici
          },
          provider_id: {
            type: String,
            required: true,
          },
          created_at: {
            type: Date,
            default: Date.now,
          },  
        }
      }
);
const UserModel= mongoose.model('social-logins', OAuth);
module.exports = UserModel;



