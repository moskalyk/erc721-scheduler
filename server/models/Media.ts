import mongoose from 'mongoose';
import { Counter } from './Counter.ts'

const mediaSchema = new mongoose.Schema({
    id: Number,
    uri: String,
    time: Number,
    like: Number
});


mediaSchema.pre('save', async function (next) {
    if (!this.id) {
        const counter = await Counter.findOneAndUpdate({}, { $inc: { counter: 1 } }, { new: true, upsert: true });
        console.log(counter.counter)
        this.id = counter.counter;
    }else {
        console.log('here')
    }
    next();
});

const Media = mongoose.model('Media', mediaSchema);

export {
    Media
}