import UniversalSchema from 'lego-starter-kit/utils/UniversalSchema';

export function getSchema(ctx) {
  const { db } = ctx;
  const { ObjectId } = db.Schema.Types;
  const schema = new UniversalSchema({
    userId: {
      type: ObjectId,
      ref: 'User',
      index: true,
    },
    offerId: {
      type: ObjectId,
      ref: 'Offer',
      index: true,
    },
    offerUserId: {
      type: ObjectId,
      ref: 'Offer',
      index: true,
    },
    status: {
      type: String,
      enum: ['accepted', 'rejected', 'review'],
      default: 'review',
    },
    info: {
      type: Object,
      // content
    },
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

  schema.virtual('user', {
    ref: 'User', // The model to use
    localField: 'userId', // Find people where `localField`
    foreignField: '_id', // is equal to `foreignField`,
    justOne: true,
  });
  schema.virtual('offerUser', {
    ref: 'User', // The model to use
    localField: 'offerUserId', // Find people where `localField`
    foreignField: '_id', // is equal to `foreignField`,
    justOne: true,
  });
  schema.virtual('offer', {
    ref: 'Offer', // The model to use
    localField: 'offerId', // Find people where `localField`
    foreignField: '_id', // is equal to `foreignField`,
    justOne: true,
  });

  schema.post('save', function () {
    // @TODO: Убрать захардкоженный ID
    console.log('save deal!!!')
    ctx.modules.notification.notify({
      subjectId: this._id,
      subjectType: 'Deal',
      objectId: this.offerId,
      objectType: 'Offer',
      action: 'deal',
      userId: '590446cd993cd10011d7fde3',
    });
    console.log('deal NOTIFY!!!!!!')
  });

  return schema;
}

export default(ctx) => {
  return ctx.db.model('Deal', getSchema(ctx).getMongooseSchema(), 'deals');
};
