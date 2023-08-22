import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    counter: {
        type: Number,
        default: 0,
    },
});

const Counter = mongoose.model('Counter', counterSchema);

export {
    Counter
}