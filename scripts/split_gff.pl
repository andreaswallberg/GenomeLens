#!/usr/bin/perl -w

# Copyright (c) 2025 Andreas Wallberg (Uppsala University)

# Distributed as a companion CLI script to GenomeLens under the same license.

# The purpose of this Perl script is to split a GFF file by sequence, creating
# one new GFF file per sequence in the original GFF file. The input GFF can be
# compressed with gzip/bgzip or uncompressed. It automatically names the output.

# Typical usage:

# perl split_gff.pl --in myfile.gff
# or
# ./split_gff.pl --in myfile.gff

use strict;
use warnings;
use 5.010;

use Getopt::Long;

my $opt = {

	'in' => [] ,

};

GetOptions(

	$opt ,
	
	# One or more user provided GFF files
	
	'in|gff=s{,}' ,
	
);

foreach my $gff_file ( @{ $opt->{ 'in' } } ) {

	my $gff_in;
	
	if ( $gff_file =~ m/\.gz$/ ) {

		open ( $gff_in , "zcat $gff_file |" ) or die "$!";
	
	}
	
	else {
	
		open ( $gff_in , "<" , $gff_file ) or die "$!";
	
	}
	
	my $out_file;
	my $out;
	
	my $last_seq = "";
	
	while (<$gff_in>) {

		chomp;
		
		if ( $_ =~ m/^#/ ) {
		
			next;
		
		}
		
		elsif ( $_ =~ m/.+/ ) {
		
			my @data = split ( /\t/ , $_ );
			
			my $seq = $data[ 0 ];
			
			unless ( $seq eq $last_seq ) {
			
				my $out_file = "${gff_file}.split.${seq}.gff";
				
				open ( $out , ">" , $out_file ) or die "$!";
			
			}
			
			say $out $_;
			
			$last_seq = $seq;
		
		}
		
	}

}
