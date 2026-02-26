class CreateAuctions < ActiveRecord::Migration[7.1]
  def change
    create_table :auctions do |t|
      t.string :item_name, null: false
      t.references :auctioneer, null: false, foreign_key: { to_table: :users }
      t.datetime :ends_at, null: false

      t.timestamps
    end
  end
end
