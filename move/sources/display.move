module walrus_nft_media_vault::display;

use std::string;
use sui::display;
use sui::package;
use walrus_nft_media_vault::nft::NFT;

public struct DISPLAY has drop {}

fun init(otw: DISPLAY, ctx: &mut tx_context::TxContext) {
    let publisher = package::claim(otw, ctx);
    let fields = vector[
        string::utf8(b"name"),
        string::utf8(b"description"),
        string::utf8(b"image_url"),
        string::utf8(b"link"),
        string::utf8(b"project_url"),
        string::utf8(b"media_type"),
        string::utf8(b"file_hash"),
        string::utf8(b"walrus_blob_id"),
        string::utf8(b"animation_url"),
        string::utf8(b"media_url"),
        string::utf8(b"thumbnail_url"),
    ];
    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{description}"),
        string::utf8(b"https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-quilt-patch-id/{thumbnail_quilt_patch_id}"),
        string::utf8(b"https://walrus-nft-media-vault.vercel.app/nft/{id}"),
        string::utf8(b"https://walrus-nft-media-vault.vercel.app"),
        string::utf8(b"{media_type}"),
        string::utf8(b"{file_hash}"),
        string::utf8(b"{image_blob_id}"),
        string::utf8(b"https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-quilt-patch-id/{quilt_patch_id}"),
        string::utf8(b"https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-quilt-patch-id/{quilt_patch_id}"),
        string::utf8(b"https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-quilt-patch-id/{thumbnail_quilt_patch_id}"),
    ];
    let mut nft_display = display::new_with_fields<NFT>(&publisher, fields, values, ctx);
    display::update_version(&mut nft_display);

    transfer::public_transfer(publisher, tx_context::sender(ctx));
    transfer::public_transfer(nft_display, tx_context::sender(ctx));
}
