#!/usr/bin/perl -w

# Copyright (c) 2025 Andreas Wallberg (Uppsala University)

# Distributed as a companion CLI script to GenomeLens under the same license.

# The purpose of this Perl script is to rewrite a GFF file so that parts of
# genes (e.g. CDSs and UTRs) can be displayed in GenomeLens. Features to match
# and rewrite are specified with one or case insensitive patterns. The input GFF
# can be compressed with gzip/bgzip or uncompressed.

# Typical usage:

# perl rewrite_gff.pl --rewrite CDS UTR --in myfile.gff > myfile.rewritten.gff
# or
# ./rewrite_gff.pl --rewrite CDS UTR --in myfile.gff > myfile.rewritten.gff

use strict;
use warnings;
use 5.010;

use Getopt::Long;

my $opt = {

	# We always keep and rewrite "gene" features

	'rewrite' => [ "gene" ] ,
	
	'in' => [] ,

};

GetOptions(

	$opt ,
	
	# User-specified feature text patterns to match in order to keep a feature
	# e.g. CDS or UTR
	
	'rewrite=s{,}' ,
	
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

	while (<$gff_in>) {

		chomp;
		
		if ( $_ =~ m/^#/ ) {
		
			say $_;
		
		}
		
		else {
		
			my @data = split ( /\t/ , $_ );

			my $feature;
			
			# If this file already has a feature in the GL_Type attribute,
			# get it from there
			
			if ( $data[ 1 ] =~ m/GL_Feature\=(\S+)/ ) {
			
				$feature = $1;
			
			}
			
			# Otherwise, get it from the third column
			
			else {
			
				$feature = $data[ 2 ];
			
			}
			
			# Check if the feature matches any of the patterns provided to keep
			# and rewrite the feature for GenomeLens
			
			my $keep = 0;
			
			foreach my $keep_feature ( @{ $opt->{ 'rewrite' } } ) {
			
				if ( $feature =~ m/$keep_feature/i ) {
				
					$keep = 1;
					last;
				
				}
			
			}
			
			my @attributes;
			
			if ( $keep ) {
			
				foreach my $attribute ( split ( /\;/ , $data[ 8 ] ) ) {
					
					# Rename this attribute, in order to strip the file of
					# nestedness of the rewritten features, but keep track on
					# their nested origin
					
					if ( $attribute =~ m/^Parent\=([^\;]+)/ ) {
					
						push @attributes , "GL_Parent=$1";
					
					}
					
					else {
					
						push @attributes , $attribute;
					
					}
				
				}
				
				my $gl_feature = "GL_Feature=${feature}";
			
				$data[ 1 ] = $gl_feature;
			
				$data[ 2 ] = "gene";
				
				$data[ 8 ] = join ( ";" , @attributes );
				
				say join ( "\t" , @data );
			
			}
		
		}
		
	}

}
