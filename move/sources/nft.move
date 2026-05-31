module walrus_nft_media_vault::nft;

use std::string::{Self, String};
use sui::clock::{Self, Clock};
use sui::event;

public struct NFT has key, store {
    id: object::UID,
    name: String,
    description: String,
    image_blob_id: String,
    quilt_patch_id: String,
    file_name: String,
    thumbnail_blob_id: String,
    thumbnail_quilt_patch_id: String,
    thumbnail_file_name: String,
    media_type: String,
    created_at: u64,
    file_hash: String,
}

public struct AdminCap has key {
    id: object::UID,
}

public struct Minted has copy, drop {
    object_id: object::ID,
    owner: address,
    image_blob_id: String,
    quilt_patch_id: String,
    file_name: String,
    thumbnail_blob_id: String,
    thumbnail_quilt_patch_id: String,
    thumbnail_file_name: String,
    media_type: String,
    file_hash: String,
    created_at: u64,
}

fun init(ctx: &mut tx_context::TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
}

entry fun init_once(ctx: &mut tx_context::TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
}

entry fun mint(
    name: vector<u8>,
    description: vector<u8>,
    image_blob_id: vector<u8>,
    quilt_patch_id: vector<u8>,
    file_name: vector<u8>,
    thumbnail_blob_id: vector<u8>,
    thumbnail_quilt_patch_id: vector<u8>,
    thumbnail_file_name: vector<u8>,
    media_type: vector<u8>,
    file_hash: vector<u8>,
    clock: &Clock,
    ctx: &mut tx_context::TxContext,
) {
    let created_at = clock::timestamp_ms(clock);
    let nft = NFT {
        id: object::new(ctx),
        name: string::utf8(name),
        description: string::utf8(description),
        image_blob_id: string::utf8(image_blob_id),
        quilt_patch_id: string::utf8(quilt_patch_id),
        file_name: string::utf8(file_name),
        thumbnail_blob_id: string::utf8(thumbnail_blob_id),
        thumbnail_quilt_patch_id: string::utf8(thumbnail_quilt_patch_id),
        thumbnail_file_name: string::utf8(thumbnail_file_name),
        media_type: string::utf8(media_type),
        created_at,
        file_hash: string::utf8(file_hash),
    };
    let object_id = object::id(&nft);
    let owner = tx_context::sender(ctx);

    event::emit(Minted {
        object_id,
        owner,
        image_blob_id: nft.image_blob_id,
        quilt_patch_id: nft.quilt_patch_id,
        file_name: nft.file_name,
        thumbnail_blob_id: nft.thumbnail_blob_id,
        thumbnail_quilt_patch_id: nft.thumbnail_quilt_patch_id,
        thumbnail_file_name: nft.thumbnail_file_name,
        media_type: nft.media_type,
        file_hash: nft.file_hash,
        created_at,
    });

    transfer::transfer(nft, owner);
}

public fun id(nft: &NFT): object::ID {
    object::id(nft)
}

public fun name(nft: &NFT): &String {
    &nft.name
}

public fun description(nft: &NFT): &String {
    &nft.description
}

public fun image_blob_id(nft: &NFT): &String {
    &nft.image_blob_id
}

public fun media_type(nft: &NFT): &String {
    &nft.media_type
}

public fun quilt_patch_id(nft: &NFT): &String {
    &nft.quilt_patch_id
}

public fun file_name(nft: &NFT): &String {
    &nft.file_name
}

public fun thumbnail_blob_id(nft: &NFT): &String {
    &nft.thumbnail_blob_id
}

public fun thumbnail_quilt_patch_id(nft: &NFT): &String {
    &nft.thumbnail_quilt_patch_id
}

public fun thumbnail_file_name(nft: &NFT): &String {
    &nft.thumbnail_file_name
}

public fun created_at(nft: &NFT): u64 {
    nft.created_at
}

public fun file_hash(nft: &NFT): &String {
    &nft.file_hash
}
