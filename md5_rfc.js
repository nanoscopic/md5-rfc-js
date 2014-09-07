// Copyright (C) 2014 David Helkowski
// Based off pseudocode from RFC 1321
// MIT License

//Note: All variables are unsigned 32 bits and wrap modulo 2^32 when calculating

//Define r as the following

var r = [
  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21 ];

//Use binary integer part of the sines of integers as constants:
var k = [];
for( var i = 0; i < 64; i++ ) k[ i ] = Math.floor( Math.abs( Math.sin( i + 1 ) ) * Math.pow( 2, 32 ) );

//Initialize variables:
var h0 = 0x67452301;
var h1 = 0xEFCDAB89;
var h2 = 0x98BADCFE;
var h3 = 0x10325476;

function expand( words, olen ) {
  var extra = ( 16 - ( words.length % 16 ) ) - 3;
  words.push( 0x80 );
  for( var i = 0; i < extra; i++ ) words.push( 0x00 );
  words.push( olen * 8 );
  words.push( 0x00 );  
  return words;
}

function chunk( words ) {
  var a = h0;
  var b = h1;
  var c = h2;
  var d = h3;
  
  for( var i = 0; i < 64; i++ ) {
    if( 0 <= i && i <= 15 ) {
      f = ( b & c ) | ( ( ~b ) & d );
      g = i;
    }
    else if( 16 <= i && i <= 31 ) {
      f = ( d & b ) | ( ( ~d ) & c );
      g = ( 5 * i + 1 ) % 16;
    }
    else if( 32 <= i && i <= 47 ) {
      f = b ^ c ^ d;
      g = ( 3 * i + 5) % 16;
    }
    else if( 48 <= i && i <= 63 ) {
      f = c ^ ( b | ( ~d ) );
      g = ( 7 * i ) % 16;
    }
    
    // a = b + rol( a + f + words[ g ] + k[ i ], r[ i ] );
    // a = b + remap bits of ( a + mux of bcd + specific chunk + some number )
    // a = b + remap bits of ( a + mux of bcd + bits input + specific bits )
    // 32 bits = 32 bits + 32 bits + 32 bits + 32 bits + constant
    a = sa( b, bit_rol( sa( a, sa( f, sa( words[ g ], k[ i ] ) ) ), r[i] ) );
    var temp = d;
    d = c;
    c = b;
    b = a;
    a = temp;
  }
  
  h0 = sa( h0, a );
  h1 = sa( h1, b );
  h2 = sa( h2, c );
  h3 = sa( h3, d );
}

// This particular implementation of "safe add" and "bit rotate left" was gleaned off the internet and is believe
//   to be public domain. If you know otherwise let me know and I will adjust the license of this whole file to be
//   compatible with this code.
function sa( x, y ) {
  var lsw = ( x & 0xFFFF ) + ( y & 0xFFFF ); // add the lower part
  var msw = ( x >> 16 ) + ( y >> 16) + ( lsw >> 16 ); // add the upper part, including carry
  return ( msw << 16 ) | ( lsw & 0xFFFF ); // put the parts together, removing carry from lower
}
function bit_rol( num, cnt ) {
  return ( num << cnt ) | ( num >>> ( 32 - cnt ) );
}

var hD = "0123456789ABCDEF";
function d2h( d ) {
  var res = [], ret = '', map = [ 6, 7, 4, 5, 2, 3, 0, 1 ];
  //01 23 45 67 -> 67 45 23 01
  for( var i = 0; i < 8; i++ ) {
    res[ 7 - i ] = hD.substr( d & 0xF, 1 );
    d >>= 4;
  }
  for( var i = 0; i < 8; i++ ) ret += res[ map[ i ] ];
  return ret;
}

function calc_md5( bytes ) {
  var z = [];
  for( var i = 0; i < bytes.length / 4; i++ ) {
    var j = i * 4;
    z[ i ] = bytes.charCodeAt( j + 3 ) << 8;
    z[ i ] += bytes.charCodeAt( j + 2 );
    z[ i ] <<= 8;
    z[ i ] += bytes.charCodeAt( j + 1 );
    z[ i ] <<= 8;
    z[ i ] += bytes.charCodeAt( j + 0 );
  }
  
  var pad = expand( z, bytes.length );
  var count = pad.length / 16;
  for( var i = 0; i < count; i ++ ) {
    var part = [];
    for( var j = 0; j < 16; j++) {
      part.push( pad.shift() );
    }
    chunk( part );
  }
  //var int digest := h0 append h1 append h2 append h3
  return [ d2h(h0), d2h(h1), d2h(h2), d2h(h3) ];
}
